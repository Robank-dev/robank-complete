import { PrivyClient } from '@privy-io/node';
import { HttpError } from './http';
import { db, env } from './env';

export type Session = {
  userId: string;
  email: string | null;
  evmAddress: string | null;
  solanaAddress: string | null;
  wallets: string[];
  apiKeyId?: string;
};

let client: PrivyClient | null = null;
const userCache = new Map<string, { at: number; session: Session }>();
const USER_TTL_MS = 60_000;

function privy() {
  const appId = env('PRIVY_APP_ID') || env('NEXT_PUBLIC_PRIVY_APP_ID');
  const appSecret = env('PRIVY_APP_SECRET');
  if (!appId || !appSecret) throw new HttpError(503, 'Account verification is not configured on this server.');
  return (client ||= new PrivyClient({ appId, appSecret }));
}

export async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function apiKeySession(key: string): Promise<Session> {
  if (!/^rbk_[A-Za-z0-9]{40}$/.test(key)) throw new HttpError(401, 'Invalid API key.');
  const database = db();
  if (!database) throw new HttpError(503, 'API keys are unavailable right now.');
  const row: any = await database.prepare('SELECT * FROM api_keys WHERE key_hash = ?1 AND revoked_at IS NULL').bind(await sha256Hex(key)).first();
  if (!row) throw new HttpError(401, 'This API key is invalid or has been revoked.');
  if (!row.last_used_at || Date.now() - new Date(row.last_used_at).getTime() > 300_000) {
    await database.prepare('UPDATE api_keys SET last_used_at = ?2 WHERE id = ?1').bind(row.id, new Date().toISOString()).run().catch(() => undefined);
  }
  return { userId: row.user_id, email: row.email ?? null, evmAddress: row.evm_address ?? null, solanaAddress: row.solana_address ?? null, wallets: JSON.parse(row.wallets || '[]'), apiKeyId: row.id };
}

/**
 * Verifies the Privy access token (or a personal API key) and resolves the account's wallets
 * from Privy itself. Wallet addresses supplied by the client are never trusted for authorization.
 */
export async function requireSession(request: Request, { allowApiKey = true }: { allowApiKey?: boolean } = {}): Promise<Session> {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(\S+)$/i);
  if (!match) throw new HttpError(401, 'Sign in to continue.');
  if (match[1].startsWith('rbk_')) {
    if (!allowApiKey) throw new HttpError(403, 'This action requires signing in to the ROBANK app.');
    return apiKeySession(match[1]);
  }

  let userId: string;
  try {
    const claims = await privy().utils().auth().verifyAccessToken(match[1]);
    userId = String((claims as any).user_id || '');
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, 'Your session has expired. Sign in again.');
  }
  if (!userId) throw new HttpError(401, 'Your session has expired. Sign in again.');

  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.at < USER_TTL_MS) return cached.session;

  let user: any;
  try {
    user = await privy().users()._get(userId);
  } catch {
    throw new HttpError(503, 'Account service is temporarily unavailable.');
  }
  const accounts: any[] = Array.isArray(user?.linked_accounts) ? user.linked_accounts : [];
  const wallets = accounts.filter((a) => ['wallet', 'smart_wallet'].includes(String(a?.type || '').toLowerCase()) && a?.address);
  const embedded = (chain: string) => wallets.find((a) =>
    String(a.chain_type || '').toLowerCase() === chain && String(a.wallet_client_type || a.connector_type || '').toLowerCase().includes('privy')
  )?.address || wallets.find((a) => String(a.chain_type || '').toLowerCase() === chain)?.address || null;
  const emailAccount = accounts.find((a) => a?.type === 'email');

  const session: Session = {
    userId,
    email: emailAccount?.address ? String(emailAccount.address).toLowerCase() : null,
    evmAddress: embedded('ethereum') ? String(embedded('ethereum')).toLowerCase() : null,
    solanaAddress: embedded('solana') ? String(embedded('solana')) : null,
    wallets: wallets.map((a) => String(a.address))
  };
  userCache.set(userId, { at: Date.now(), session });
  if (userCache.size > 500) userCache.delete(userCache.keys().next().value as string);
  return session;
}

export function isOwner(session: Session) {
  const wallets = env('ROBANK_OWNER_WALLET').toLowerCase().split(',').map((v) => v.trim()).filter(Boolean);
  const emails = env('ROBANK_OWNER_EMAIL').toLowerCase().split(',').map((v) => v.trim()).filter(Boolean);
  if (!wallets.length && !emails.length) return false;
  return session.wallets.some((w) => wallets.includes(w.toLowerCase())) || Boolean(session.email && emails.includes(session.email));
}
