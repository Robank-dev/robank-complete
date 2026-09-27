import { ROBINHOOD } from '@/lib/chains';
import { handle, ok } from '@/lib/server/http';
import { underlyingPrices } from '@/lib/server/portfolio';
import { getRobinhoodTokens } from '@/lib/robinhoodCatalog';

export const dynamic = 'force-dynamic';

export type StockRow = {
  id: string;
  provider: 'robinhood';
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
  const [robinhood, prices] = await Promise.allSettled([getRobinhoodTokens(), underlyingPrices()]);
  const price = prices.status === 'fulfilled' ? prices.value : new Map<string, number>();
  const rows: StockRow[] = [];
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
        networks: [{ chainId: ROBINHOOD.id, label: ROBINHOOD.label, address: token.contract, decimals: null }],
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
      robinhood: robinhood.status === 'fulfilled',
      prices: prices.status === 'fulfilled' && price.size > 0
    },
    count: rows.length,
    stocks: rows
  }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } });
});
