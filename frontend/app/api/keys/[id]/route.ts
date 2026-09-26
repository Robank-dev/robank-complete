import { requireSession } from '@/lib/server/auth';
import { HttpError, handle, ok } from '@/lib/server/http';
import { now, requireDb } from '@/lib/server/records';

export const dynamic = 'force-dynamic';

export const DELETE = handle(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const session = await requireSession(request, { allowApiKey: false });
  const id = String((await context.params).id).slice(0, 64);
  const result = await requireDb().prepare('UPDATE api_keys SET revoked_at = ?3 WHERE id = ?1 AND user_id = ?2 AND revoked_at IS NULL').bind(id, session.userId, now()).run();
  if (!result.meta.changes) throw new HttpError(404, 'Key not found.');
  return ok({ ok: true });
});
