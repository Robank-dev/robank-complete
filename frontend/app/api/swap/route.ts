import { requireSession } from '@/lib/server/auth';
import { HttpError, handle, ok, readJson, text } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { quoteSwap } from '@/lib/server/swap';

export const dynamic = 'force-dynamic';

// Quotes a Stock Token buy/sell on Robinhood Chain and returns calldata for the signed-in wallet to sign.
export const POST = handle(async (request: Request) => {
  const session = await requireSession(request);
  await rateLimit(`swap:${session.userId}`, 30, 60);
  const body = await readJson(request);
  const side = body.side === 'sell' ? 'sell' : 'buy';
  const symbol = text(body.symbol, { max: 64, required: true, name: 'Stock' });
  const amount = text(body.amount, { max: 32, required: true, name: 'Amount' });
  if (!session.evmAddress) throw new HttpError(409, 'Your wallet is still being prepared.');
  return ok({ quote: await quoteSwap({ side, symbol, amount, sender: session.evmAddress }) });
});
