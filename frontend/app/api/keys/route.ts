import { requireSession, sha256Hex } from '@/lib/server/auth';
import { HttpError, handle, ok, readJson, text } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { newId, now, requireDb } from '@/lib/server/records';

export const dynamic = 'force-dynamic';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function randomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(40));
  return 'rbk_' + [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('');
}
const view = (row: any) => ({ id: row.id, name: row.name, prefix: row.prefix, createdAt: row.created_at, lastUsedAt: row.last_used_at ?? null });

// Key management always requires a real app session, never another API key.
export const GET = handle(async (request: Request) => {
  const session = await requireSession(request, { allowApiKey: false });
  const { results } = await requireDb().prepare('SELECT * FROM api_keys WHERE user_id = ?1 AND revoked_at IS NULL ORDER BY created_at DESC').bind(session.userId).all();
  return ok({ keys: results.map(view) });
});

export const POST = handle(async (request: Request) => {
  const session = await requireSession(request, { allowApiKey: false });
  await rateLimit(`keys:${session.userId}`, 10, 3600);
  const body = await readJson(request);
  const name = text(body.name, { max: 40, name: 'Key name' }) || 'CLI';
  const database = requireDb();
  const count = await database.prepare('SELECT COUNT(*) AS n FROM api_keys WHERE user_id = ?1 AND revoked_at IS NULL').bind(session.userId).first<{ n: number }>();
  if (Number(count?.n || 0) >= 5) throw new HttpError(409, 'You can have up to 5 active keys. Revoke one first.');
  const key = randomKey();
  const row = { id: newId(), name, prefix: key.slice(0, 10), created_at: now() };
  await database.prepare('INSERT INTO api_keys (id, user_id, name, prefix, key_hash, email, evm_address, solana_address, wallets, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)')
    .bind(row.id, session.userId, name, row.prefix, await sha256Hex(key), session.email, session.evmAddress, session.solanaAddress, JSON.stringify(session.wallets), row.created_at).run();
  return ok({ key, record: view(row) }, { status: 201 });
});
