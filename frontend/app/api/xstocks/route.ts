import { HttpError, handle, ok } from '@/lib/server/http';
import { getXStocksCatalog } from '@/lib/xstocksCatalog';

export const dynamic = 'force-dynamic';

export const GET = handle(async () => {
  const assets = await getXStocksCatalog().catch(() => { throw new HttpError(502, 'The xStocks catalog is unavailable right now.'); });
  return ok({ generatedAt: new Date().toISOString(), count: assets.length, assets }, { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=900' } });
});
