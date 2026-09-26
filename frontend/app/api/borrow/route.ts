import { STABLECOINS } from '@/lib/chains';
import { HttpError, fetchJson, handle, ok } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

const CHAINS = [8453, 4663];
const MORPHO: Record<number, string> = { 8453: '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb', 4663: '0x9D53d5E3bd5E8d4Cbfa6DB1ca238AEA02E651010' };
const LOAN_ASSETS = STABLECOINS.filter((t) => CHAINS.includes(t.chainId));

export type BorrowMarket = {
  chainId: number; marketId: string; morpho: string;
  params: { loanToken: string; collateralToken: string; oracle: string; irm: string; lltv: string };
  loan: { symbol: string; decimals: number };
  collateral: { symbol: string; name: string; decimals: number; logo: string | null; priceUsd: number | null };
  lltvPercent: number; borrowApy: number | null; supplyApy: number | null; liquidityUsd: number | null; utilization: number | null;
  warnings: string[];
};

let cache: { at: number; markets: BorrowMarket[] } | null = null;

const QUERY = `query($chains:[Int!], $loans:[String!]) { markets(first: 200, orderBy: SupplyAssetsUsd, orderDirection: Desc, where: { chainId_in: $chains, loanAssetAddress_in: $loans, listed: true }) { items {
  marketId lltv oracleAddress irmAddress morphoBlue { address chain { id } }
  loanAsset { address symbol decimals } collateralAsset { address symbol name decimals logoURI priceUsd }
  state { borrowApy supplyApy liquidityAssetsUsd utilization } warnings { type level } } } }`;

async function loadMarkets(): Promise<BorrowMarket[]> {
  const body = await fetchJson<any>('https://blue-api.morpho.org/graphql', {
    method: 'POST', provider: 'Morpho', timeoutMs: 10_000,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY, variables: { chains: CHAINS, loans: LOAN_ASSETS.map((t) => t.address) } })
  });
  const items: any[] = body?.data?.markets?.items;
  if (!Array.isArray(items)) throw new HttpError(502, 'Morpho returned an unexpected response.');
  const out: BorrowMarket[] = [];
  for (const m of items) {
    const chainId = Number(m?.morphoBlue?.chain?.id);
    const morpho = String(m?.morphoBlue?.address || '');
    const loan = LOAN_ASSETS.find((t) => t.chainId === chainId && t.address.toLowerCase() === String(m?.loanAsset?.address || '').toLowerCase());
    const collateral = m?.collateralAsset;
    // Only markets on the canonical Morpho deployment, with a known loan asset and a real collateral token.
    if (!loan || morpho.toLowerCase() !== MORPHO[chainId]?.toLowerCase() || !collateral?.address || !/^0x[a-fA-F0-9]{40}$/.test(collateral.address)) continue;
    const warnings = (m.warnings || []).map((w: any) => `${w.level}:${w.type}`);
    if (warnings.some((w: string) => w.startsWith('RED'))) continue;
    const liquidityUsd = m.state?.liquidityAssetsUsd != null ? Number(m.state.liquidityAssetsUsd) : null;
    if (liquidityUsd != null && liquidityUsd < 1000) continue;
    out.push({
      chainId, marketId: String(m.marketId), morpho,
      params: { loanToken: loan.address, collateralToken: collateral.address, oracle: String(m.oracleAddress), irm: String(m.irmAddress), lltv: String(m.lltv) },
      loan: { symbol: loan.symbol, decimals: loan.decimals },
      collateral: { symbol: String(collateral.symbol || '?').slice(0, 20), name: String(collateral.name || collateral.symbol || '').slice(0, 80), decimals: Number(collateral.decimals), logo: typeof collateral.logoURI === 'string' && collateral.logoURI.startsWith('https://') ? collateral.logoURI : null, priceUsd: collateral.priceUsd != null ? Number(collateral.priceUsd) : null },
      lltvPercent: Number(BigInt(m.lltv) / BigInt(10) ** BigInt(14)) / 100,
      borrowApy: m.state?.borrowApy != null ? Number(m.state.borrowApy) * 100 : null,
      supplyApy: m.state?.supplyApy != null ? Number(m.state.supplyApy) * 100 : null,
      liquidityUsd,
      utilization: m.state?.utilization != null ? Number(m.state.utilization) * 100 : null,
      warnings
    });
  }
  return out;
}

export const GET = handle(async () => {
  if (!cache || Date.now() - cache.at > 60_000) {
    try {
      cache = { at: Date.now(), markets: await loadMarkets() };
    } catch (error) {
      if (!cache) throw error;
    }
  }
  const byChain = CHAINS.map((chainId) => ({ chainId, morpho: MORPHO[chainId], markets: cache!.markets.filter((m) => m.chainId === chainId).slice(0, 40) }));
  return ok({ generatedAt: new Date(cache.at).toISOString(), provider: 'Morpho', networks: byChain }, { headers: { 'Cache-Control': 'public, max-age=30' } });
});
