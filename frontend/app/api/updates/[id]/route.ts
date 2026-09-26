import { isOwner, requireSession } from '@/lib/server/auth';
import { HttpError, handle, ok } from '@/lib/server/http';
import { requireDb } from '@/lib/server/records';

export const dynamic = 'force-dynamic';

export const DELETE = handle(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const session = await requireSession(request);
  if (!isOwner(session)) throw new HttpError(403, 'Only the ROBANK team can remove updates.');
  const { id } = await context.params;
  const result = await requireDb().prepare('DELETE FROM updates WHERE id = ?1').bind(String(id).slice(0, 64)).run();
  if (!result.meta.changes) throw new HttpError(404, 'Update not found.');
  return ok({ ok: true });
});
