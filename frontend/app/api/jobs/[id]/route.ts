import { parseAmount, stablecoin } from '@/lib/chains';
import { requireSession } from '@/lib/server/auth';
import { HttpError, handle, ok, readJson, text } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { now, requireDb, toJob } from '@/lib/server/records';
import { verifyStableTransfer } from '@/lib/server/verifyTransfer';

export const dynamic = 'force-dynamic';

// Every transition is a conditional UPDATE on the current status, so double clicks and races
// can never move a job twice or let two workers claim it.
export const POST = handle(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const session = await requireSession(request);
  await rateLimit(`jobs:act:${session.userId}`, 60, 3600);
  const id = String((await context.params).id).slice(0, 64);
  const body = await readJson(request);
  const action = String(body.action || '');
  const database = requireDb();
  const job: any = await database.prepare('SELECT * FROM jobs WHERE id = ?1').bind(id).first();
  if (!job) throw new HttpError(404, 'Job not found.');
  const isCreator = job.creator_user_id === session.userId;
  const isWorker = job.worker_user_id === session.userId;
  const at = now();
  let result: { meta: { changes: number } };

  switch (action) {
    case 'claim':
      if (isCreator) throw new HttpError(403, 'You cannot claim your own job.');
      if (!session.evmAddress) throw new HttpError(409, 'Your wallet is still being prepared.');
      result = await database.prepare("UPDATE jobs SET status = 'claimed', worker_user_id = ?2, worker_wallet = ?3, updated_at = ?4 WHERE id = ?1 AND status = 'open'")
        .bind(id, session.userId, session.evmAddress, at).run();
      break;
    case 'submit': {
      if (!isWorker) throw new HttpError(403, 'Only the worker on this job can submit.');
      const submission = text(body.submission, { max: 6000, required: true, name: 'Submission' });
      result = await database.prepare("UPDATE jobs SET status = 'submitted', submission = ?2, updated_at = ?3 WHERE id = ?1 AND status = 'claimed' AND worker_user_id = ?4")
        .bind(id, submission, at, session.userId).run();
      break;
    }
    case 'approve':
      if (!isCreator) throw new HttpError(403, 'Only the job creator can approve.');
      result = await database.prepare("UPDATE jobs SET status = 'approved', updated_at = ?2 WHERE id = ?1 AND status = 'submitted'").bind(id, at).run();
      break;
    case 'reject':
      if (!isCreator) throw new HttpError(403, 'Only the job creator can request changes.');
      result = await database.prepare("UPDATE jobs SET status = 'claimed', updated_at = ?2 WHERE id = ?1 AND status = 'submitted'").bind(id, at).run();
      break;
    case 'cancel':
      if (!isCreator) throw new HttpError(403, 'Only the job creator can cancel.');
      result = await database.prepare("UPDATE jobs SET status = 'cancelled', updated_at = ?2 WHERE id = ?1 AND status IN ('open', 'claimed')").bind(id, at).run();
      break;
    case 'record-payout': {
      if (!isCreator) throw new HttpError(403, 'Only the job creator can record the payout.');
      if (job.status !== 'approved') throw new HttpError(409, 'Approve the work before recording a payout.');
      if (!job.reward_amount || !job.reward_asset || !job.reward_chain_id || !job.worker_wallet) throw new HttpError(409, 'This job has no on-chain reward to record.');
      const token = stablecoin(Number(job.reward_chain_id), job.reward_asset);
      const minRaw = token ? parseAmount(String(job.reward_amount), token.decimals) : null;
      if (!token || !minRaw) throw new HttpError(409, 'This job reward can no longer be verified.');
      const txHash = text(body.txHash, { max: 66, required: true, name: 'Transaction hash' }).toLowerCase();
      await verifyStableTransfer({ chainId: Number(job.reward_chain_id), asset: job.reward_asset, txHash, from: job.creator_wallet, to: job.worker_wallet, minRaw });
      try {
        result = await database.prepare("UPDATE jobs SET status = 'paid', payout_tx_hash = ?2, updated_at = ?3 WHERE id = ?1 AND status = 'approved'").bind(id, txHash, at).run();
      } catch {
        throw new HttpError(409, 'That transaction has already been recorded for another job.');
      }
      break;
    }
    default:
      throw new HttpError(400, 'Unknown action.');
  }
  if (!result.meta.changes) throw new HttpError(409, 'This job changed in the meantime. Refresh and try again.');
  const row = await database.prepare('SELECT * FROM jobs WHERE id = ?1').bind(id).first();
  return ok({ job: toJob(row, session.userId) });
});
