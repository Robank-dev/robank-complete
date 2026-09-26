import { CHAINS, STABLECOINS, chainById, isAddressFor, stableByAddress } from '@/lib/chains';
import { requireSession } from '@/lib/server/auth';
import { env } from '@/lib/server/env';
import { HttpError, fetchJson, handle, ok, readJson } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

const LIFI = 'https://li.quest/v1';

function headers(): Record<string, string> {
  const key = env('LIFI_API_KEY');
  return key ? { 'x-lifi-api-key': key } : {};
}

export const GET = handle(async (_request: Request, context: { params: Promise<{ path?: string[] }> }) => {
  const resource = ((await context.params).path || []).join('/');
  if (resource !== 'tokens') throw new HttpError(404, 'Not found.');
  // The token list is ROBANK's own verified registry; LI.FI is only used for routing.
  const tokens = STABLECOINS.map((t) => ({ chainId: t.chainId, address: t.address, symbol: t.symbol, decimals: t.decimals }));
  return ok({ tokens, chains: CHAINS.map((c) => ({ id: c.id, label: c.label })) }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
});

export const POST = handle(async (request: Request, context: { params: Promise<{ path?: string[] }> }) => {
  const resource = ((await context.params).path || []).join('/');
  if (resource !== 'quote') throw new HttpError(404, 'Not found.');
  const session = await requireSession(request);
  await rateLimit(`lifi:${session.userId}`, 40, 60);
  const body = await readJson(request);

  const fromChain = Number(body.fromChain);
  const toChain = Number(body.toChain);
  const from = chainById(fromChain);
  const to = chainById(toChain);
  if (!from || !to) throw new HttpError(400, 'Unsupported source or destination network.');
  if (fromChain === toChain) throw new HttpError(400, 'Same-network transfers do not need a route.');
  const source = stableByAddress(fromChain, String(body.fromToken || ''));
  const destination = stableByAddress(toChain, String(body.toToken || ''));
  if (!source || !destination) throw new HttpError(400, 'Unsupported asset for this network.');
  const toAddress = String(body.toAddress || '').trim();
  if (!isAddressFor(toChain, toAddress)) throw new HttpError(400, `Recipient is not a valid ${to.label} address.`);
  const amount = String(body.amount || '');
  if (!/^[1-9]\d{0,30}$/.test(amount)) throw new HttpError(400, 'Invalid amount.');
  const fromAddress = from.type === 'solana' ? session.solanaAddress : session.evmAddress;
  if (!fromAddress) throw new HttpError(409, `Your ${from.label} wallet is still being prepared.`);
  const mode = body.mode === 'toAmount' ? 'toAmount' : 'fromAmount';

  const params = new URLSearchParams({
    fromChain: String(fromChain), toChain: String(toChain), fromToken: source.address, toToken: destination.address,
    fromAddress, toAddress, [mode]: amount, slippage: '0.005', order: 'CHEAPEST', integrator: 'robank'
  });
  const feeBps = Number(env('ROBANK_LIFI_FEE_BPS') || 0);
  if (Number.isFinite(feeBps) && feeBps > 0 && feeBps <= 100) params.set('fee', String(feeBps / 10000));

  let quote: any;
  try {
    quote = await fetchJson(`${LIFI}/${mode === 'toAmount' ? 'quote/toAmount' : 'quote'}?${params}`, { headers: headers(), provider: 'LI.FI', timeoutMs: 15000 });
  } catch (error) {
    if (error instanceof HttpError && error.status === 502) throw new HttpError(422, 'No route is available for this transfer right now. Try a different amount or network.');
    throw error;
  }
  // Refuse any quote that does not match exactly what the user asked for.
  const action = quote?.action;
  const sameAddr = (a: unknown, b: string) => String(a || '').toLowerCase() === b.toLowerCase();
  if (Number(action?.fromChainId) !== fromChain || Number(action?.toChainId) !== toChain || !sameAddr(action?.fromToken?.address, source.address) || !sameAddr(action?.toToken?.address, destination.address) || !sameAddr(action?.toAddress ?? toAddress, toAddress) || !sameAddr(action?.fromAddress ?? fromAddress, fromAddress)) {
    throw new HttpError(502, 'The routing provider returned a quote that does not match your request. Nothing was sent.');
  }
  return ok({ quote });
});
