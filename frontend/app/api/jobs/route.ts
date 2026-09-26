import { chainById, parseAmount, stablecoin } from '@/lib/chains';
import { requireSession } from '@/lib/server/auth';
import { HttpError, handle, ok, readJson, text } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { newId, now, requireDb, toJob } from '@/lib/server/records';

export const dynamic = 'force-dynamic';

export const GET = handle(async (request: Request) => {
  const session = await requireSession(request);
  const scope = new URL(request.url).searchParams.get('scope') === 'mine' ? 'mine' : 'open';
  const database = requireDb();
  const { results } = scope === 'mine'
    ? await database.prepare('SELECT * FROM jobs WHERE creator_user_id = ?1 OR worker_user_id = ?1 ORDER BY updated_at DESC LIMIT 100').bind(session.userId).all()
    : await database.prepare("SELECT * FROM jobs WHERE status = 'open' ORDER BY created_at DESC LIMIT 100").all();
  return ok({ jobs: results.map((row) => toJob(row, session.userId)) });
});

export const POST = handle(async (request: Request) => {
  const session = await requireSession(request);
  if (!session.evmAddress) throw new HttpError(409, 'Your wallet is still being prepared. Try again in a moment.');
  await rateLimit(`jobs:create:${session.userId}`, 10, 3600);
  const body = await readJson(request);
  const title = text(body.title, { max: 120, required: true, name: 'Title' });
  const description = text(body.description, { max: 6000, required: true, name: 'Description' });
  if (title.length < 4) throw new HttpError(400, 'Title is too short.');
  if (description.length < 20) throw new HttpError(400, 'Describe the task in at least 20 characters.');

  let rewardAmount: string | null = null;
  let rewardAsset: string | null = null;
  let rewardChainId: number | null = null;
  const rawAmount = text(body.rewardAmount, { max: 24, name: 'Reward' });
  if (rawAmount) {
    rewardAsset = text(body.rewardAsset, { max: 8, required: true, name: 'Reward asset' }).toUpperCase();
    rewardChainId = Number(body.rewardChainId);
    const chain = chainById(rewardChainId);
    const token = stablecoin(rewardChainId, rewardAsset);
    if (!chain || chain.type !== 'evm' || !token) throw new HttpError(400, 'Choose a supported reward asset and network.');
    const units = parseAmount(rawAmount, token.decimals);
    if (!units) throw new HttpError(400, 'Enter a valid reward amount.');
    if (units > BigInt(1_000_000) * BigInt(10) ** BigInt(token.decimals)) throw new HttpError(400, 'Reward is above the 1,000,000 limit.');
    rewardAmount = rawAmount;
  }
  let dueAt: string | null = null;
  if (body.dueAt) {
    const due = new Date(String(body.dueAt));
    if (Number.isNaN(due.getTime()) || due.getTime() < Date.now()) throw new HttpError(400, 'Due date must be in the future.');
    dueAt = due.toISOString();
  }
  const id = newId();
  const at = now();
  await requireDb().prepare(
    `INSERT INTO jobs (id, creator_user_id, creator_wallet, title, description, reward_amount, reward_asset, reward_chain_id, status, due_at, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'open', ?9, ?10, ?10)`
  ).bind(id, session.userId, session.evmAddress, title, description, rewardAmount, rewardAsset, rewardChainId, dueAt, at).run();
  const row = await requireDb().prepare('SELECT * FROM jobs WHERE id = ?1').bind(id).first();
  return ok({ job: toJob(row, session.userId) }, { status: 201 });
});
