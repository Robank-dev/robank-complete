import { chainById } from '@/lib/chains';
import { handle, ok } from '@/lib/server/http';
import { underlyingPrices } from '@/lib/server/portfolio';
import { getRobinhoodTokens } from '@/lib/robinhoodCatalog';
import { getXStocksCatalog } from '@/lib/xstocksCatalog';

export const dynamic = 'force-dynamic';

export type StockRow = {
  id: string;
  provider: 'xstocks' | 'robinhood';
  symbol: string;
  underlying: string;
  name: string;
  logo: string | null;
  issuer: string;
  instrument: string;
  networks: Array<{ chainId: number; label: string; address: string; decimals: number | null }>;
  priceUsd: number | null;
  priceSource: string;
  multiplier: number;
  halted: boolean;
};

export const GET = handle(async () => {
  const [xstocks, robinhood, prices] = await Promise.allSettled([getXStocksCatalog(), getRobinhoodTokens(), underlyingPrices()]);
  const price = prices.status === 'fulfilled' ? prices.value : new Map<string, number>();
  const rows: StockRow[] = [];
  if (xstocks.status === 'fulfilled') {
    for (const asset of xstocks.value) {
      const base = price.get(asset.underlyingSymbol) ?? null;
      rows.push({
        id: `xstocks:${asset.id}`,
        provider: 'xstocks',
        symbol: asset.symbol,
        underlying: asset.underlyingSymbol,
        name: asset.name,
        logo: asset.logo,
        issuer: 'Backed Assets (xStocks)',
        instrument: 'Tokenized tracker certificate',
        networks: asset.deployments.map((d) => ({ chainId: d.chainId, label: chainById(d.chainId)?.label || d.network, address: d.address, decimals: d.decimals })),
        priceUsd: base,
        priceSource: 'Underlying last sale (Nasdaq screener)',
        multiplier: 1,
        halted: asset.tradingHalted
      });
    }
  }
  if (robinhood.status === 'fulfilled') {
    for (const token of robinhood.value) {
      const base = price.get(token.symbol);
      rows.push({
        id: `robinhood:${token.contract.toLowerCase()}`,
        provider: 'robinhood',
        symbol: token.symbol,
        underlying: token.symbol,
        name: token.name,
        logo: token.logo,
        issuer: 'Robinhood',
        instrument: 'Stock Token (ERC-20)',
        networks: [{ chainId: 4663, label: 'Robinhood Chain', address: token.contract, decimals: null }],
        priceUsd: base != null ? base * token.multiplier : null,
        priceSource: token.multiplier === 1 ? 'Underlying last sale (Nasdaq screener)' : `Underlying last sale × ${token.multiplier.toFixed(4)} multiplier`,
        multiplier: token.multiplier,
        halted: false
      });
    }
  }
  return ok({
    generatedAt: new Date().toISOString(),
    providers: {
      xstocks: xstocks.status === 'fulfilled',
      robinhood: robinhood.status === 'fulfilled',
      prices: prices.status === 'fulfilled' && price.size > 0
    },
    count: rows.length,
    stocks: rows
  }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } });
});
