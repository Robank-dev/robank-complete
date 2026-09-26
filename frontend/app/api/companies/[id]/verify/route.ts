import { requireSession } from '@/lib/server/auth';
import { createDiditSession } from '@/lib/server/didit';
import { HttpError, handle, ok } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { now, requireDb, toCompany } from '@/lib/server/records';

export const dynamic = 'force-dynamic';

export const POST = handle(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const session = await requireSession(request);
  await rateLimit(`kyb:${session.userId}`, 5, 3600);
  const id = String((await context.params).id).slice(0, 64);
  const database = requireDb();
  // Ownership is part of the query: another user's company id simply does not exist for you.
  const company: any = await database.prepare('SELECT * FROM companies WHERE id = ?1 AND owner_user_id = ?2').bind(id, session.userId).first();
  if (!company) throw new HttpError(404, 'Company not found.');
  if (company.verification_status === 'approved') throw new HttpError(409, 'This company is already verified.');
  const { sessionId, url } = await createDiditSession('DIDIT_KYB_WORKFLOW_ID', `robank-company-${company.id}`);
  await database.prepare("UPDATE companies SET status = 'verification_pending', verification_status = 'pending', verification_session_id = ?2, verification_url = ?3, updated_at = ?4 WHERE id = ?1")
    .bind(id, sessionId, url, now()).run();
  const row = await database.prepare('SELECT * FROM companies WHERE id = ?1').bind(id).first();
  return ok({ company: toCompany(row), url });
});
