import { requireSession } from '@/lib/server/auth';
import { handle, ok } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { readPortfolio, type Portfolio } from '@/lib/server/portfolio';

export const dynamic = 'force-dynamic';

const recent = new Map<string, { at: number; value: Promise<Portfolio> }>();

// Balances are read for the wallets Privy says belong to the signed-in account — never for a
// client-supplied address — so this endpoint cannot be used to probe or proxy arbitrary wallets.
export const GET = handle(async (request: Request) => {
  const session = await requireSession(request);
  await rateLimit(`portfolio:${session.userId}`, 30, 60);
  const key = `${session.evmAddress}|${session.solanaAddress}`;
  const fresh = new URL(request.url).searchParams.get('fresh') === '1';
  const hit = recent.get(key);
  let pending = hit && !fresh && Date.now() - hit.at < 15_000 ? hit.value : null;
  if (!pending) {
    pending = readPortfolio(session.evmAddress || '', session.solanaAddress || '');
    recent.set(key, { at: Date.now(), value: pending });
    pending.catch(() => recent.delete(key));
    if (recent.size > 200) recent.delete(recent.keys().next().value as string);
  }
  const portfolio = await pending;
  return ok({ ...portfolio, wallets: { evm: session.evmAddress, solana: session.solanaAddress } });
});
