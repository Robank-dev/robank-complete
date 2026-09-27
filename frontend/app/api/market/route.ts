import { handle, ok } from '@/lib/server/http';
import { searchMarket } from '@/lib/server/market';

export const dynamic = 'force-dynamic';

// Agent Market search: x402 services that accept USDG on Robinhood Chain.
export const GET = handle(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const q = String(params.get('q') || '').slice(0, 80);
  const limit = Math.min(Math.max(Number(params.get('limit')) || 24, 1), 60);
  const services = await searchMarket(q, limit);
  return ok({ generatedAt: new Date().toISOString(), network: 'eip155:4663', services }, { headers: { 'Cache-Control': 'public, max-age=60' } });
});
