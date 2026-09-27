import { createDiditSession, diditDecision, diditEnabled } from './didit';
import { HttpError } from './http';
import { now, requireDb } from './records';

export type IdentityStatus = 'not_started' | 'pending' | 'in_review' | 'approved' | 'declined';
type KycRow = { user_id: string; session_id: string | null; url: string | null; status: IdentityStatus; updated_at: string };

/**
 * ROBANK's own identity check (Didit, billed to ROBANK's Didit account). One verification unlocks the card
 * application and Cash out. Documents stay with Didit; ROBANK stores only the session id and status.
 */
export async function identityFor(userId: string): Promise<{ status: IdentityStatus; url: string | null; sessionId: string | null }> {
  const database = requireDb();
  const row = await database.prepare('SELECT * FROM kyc WHERE user_id = ?1').bind(userId).first<KycRow>();
  if (!row) return { status: 'not_started', url: null, sessionId: null };
  let status = row.status;
  if (row.session_id && ['pending', 'in_review'].includes(status)) {
    const fresh = await diditDecision(row.session_id);
    if (fresh && fresh !== 'not_started' && fresh !== status) {
      status = fresh;
      await database.prepare('UPDATE kyc SET status = ?2, updated_at = ?3 WHERE user_id = ?1').bind(userId, status, now()).run();
    }
  }
  return { status, url: ['pending', 'in_review'].includes(status) ? row.url : null, sessionId: row.session_id };
}

export async function startIdentity(userId: string, callbackPath = '/card') {
  if (!diditEnabled('kyc')) throw new HttpError(503, 'Identity verification is not available right now.');
  const current = await identityFor(userId);
  if (current.status === 'approved') throw new HttpError(409, 'Your identity is already verified.');
  if (current.url && current.status === 'pending') return { url: current.url };
  const { sessionId, url } = await createDiditSession('kyc', `robank-user-${userId}`, callbackPath);
  const at = now();
  await requireDb().prepare(`INSERT INTO kyc (user_id, session_id, url, status, created_at, updated_at) VALUES (?1, ?2, ?3, 'pending', ?4, ?4)
    ON CONFLICT(user_id) DO UPDATE SET session_id = ?2, url = ?3, status = 'pending', updated_at = ?4`).bind(userId, sessionId, url, at).run();
  return { url };
}
