import { SOLANA_CHAIN_ID } from './chains';

const XSTOCKS_URL = 'https://api.xstocks.fi/api/v2/public/assets';

export type XStockDeployment = { chainId: number; network: string; address: string; decimals: number };

export type XStockAsset = {
  id: string;
  symbol: string;
  name: string;
  logo: string;
  underlyingSymbol: string;
  isin: string | null;
  tradingHalted: boolean;
  deployments: XStockDeployment[];
};

// xStocks networks that ROBANK can read and sign on. Ton/Ink/XLayer/Mantle/HyperEVM are listed by
// the issuer but are not wallet networks in ROBANK, so they are excluded rather than shown as usable.
const NETWORK_TO_CHAIN: Record<string, number> = {
  Ethereum: 1,
  Arbitrum: 42161,
  Optimism: 10,
  BinanceSmartChain: 56,
  Base: 8453,
  Polygon: 137,
  Solana: SOLANA_CHAIN_ID
};

// EVM xStocks are 18-decimal ERC-20s; Solana xStocks are 8-decimal Token-2022 mints (both verified on-chain).
const DECIMALS = (chainId: number) => (chainId === SOLANA_CHAIN_ID ? 8 : 18);

let memory: { at: number; assets: XStockAsset[] } = { at: 0, assets: [] };
let inflight: Promise<XStockAsset[]> | null = null;
const TTL_MS = 15 * 60_000;
const CACHE_KEY = 'https://cache.robank.internal/xstocks-catalog-v2';

async function fetchPage(page: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);
  try {
    const response = await fetch(`${XSTOCKS_URL}?page=${page}&pageSize=100`, {
      headers: { Accept: 'application/json', 'User-Agent': 'ROBANK/1.0' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`xStocks catalog returned ${response.status}`);
    return (await response.json()) as { nodes?: any[]; page?: { hasNextPage?: boolean } };
  } finally {
    clearTimeout(timer);
  }
}

function normalize(node: any): XStockAsset | null {
  const symbol = String(node?.symbol || '').trim();
  if (!symbol || !/^[A-Za-z0-9.\-]{1,20}$/.test(symbol)) return null;
  const deployments: XStockDeployment[] = [];
  for (const item of Array.isArray(node?.deployments) ? node.deployments : []) {
    const chainId = NETWORK_TO_CHAIN[String(item?.network || '')];
    const address = String(item?.address || '').trim();
    if (!chainId || !address) continue;
    const valid = chainId === SOLANA_CHAIN_ID ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) : /^0x[a-fA-F0-9]{40}$/.test(address);
    if (!valid) continue;
    deployments.push({ chainId, network: String(item.network), address, decimals: DECIMALS(chainId) });
  }
  const logo = String(node?.logo || '');
  return {
    id: String(node?.id || symbol),
    symbol,
    name: String(node?.name || symbol).slice(0, 120),
    logo: logo.startsWith('https://') ? logo : `https://xstocks-metadata.backed.fi/logos/tokens/${encodeURIComponent(symbol)}.png`,
    underlyingSymbol: String(node?.underlyingSymbol || node?.underlying?.symbol || symbol.replace(/x$/, '')).toUpperCase(),
    isin: node?.isin ? String(node.isin) : null,
    tradingHalted: Boolean(node?.isTradingHalted),
    deployments
  };
}

async function loadFromProvider(): Promise<XStockAsset[]> {
  const first = await fetchPage(0);
  const pages = [first];
  if (first.page?.hasNextPage) {
    // The catalog is ~12 pages; fetch in parallel and stop at the first page that reports no next page.
    const rest = await Promise.all(Array.from({ length: 19 }, (_, i) => fetchPage(i + 1).catch(() => null)));
    for (const page of rest) {
      if (!page) throw new Error('xStocks catalog page failed');
      pages.push(page);
      if (!page.page?.hasNextPage) break;
    }
  }
  const seen = new Set<string>();
  const assets: XStockAsset[] = [];
  for (const page of pages) {
    for (const node of page.nodes || []) {
      const asset = normalize(node);
      if (!asset || seen.has(asset.id) || !asset.deployments.length) continue;
      seen.add(asset.id);
      assets.push(asset);
    }
  }
  if (!assets.length) throw new Error('xStocks catalog was empty');
  return assets;
}

async function readEdgeCache(): Promise<XStockAsset[] | null> {
  try {
    const cache = (globalThis as any).caches?.default as Cache | undefined;
    const hit = await cache?.match(CACHE_KEY);
    return hit ? ((await hit.json()) as XStockAsset[]) : null;
  } catch {
    return null;
  }
}

async function writeEdgeCache(assets: XStockAsset[]) {
  try {
    const cache = (globalThis as any).caches?.default as Cache | undefined;
    await cache?.put(CACHE_KEY, new Response(JSON.stringify(assets), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${TTL_MS / 1000}` }
    }));
  } catch {}
}

/** Returns the issuer's live catalog, cached in memory and at the edge. A stale copy is served if the provider fails. */
export async function getXStocksCatalog(): Promise<XStockAsset[]> {
  if (memory.assets.length && Date.now() - memory.at < TTL_MS) return memory.assets;
  if (inflight) return inflight;
  inflight = (async () => {
    const edge = await readEdgeCache();
    if (edge?.length) {
      memory = { at: Date.now(), assets: edge };
      return edge;
    }
    try {
      const assets = await loadFromProvider();
      memory = { at: Date.now(), assets };
      await writeEdgeCache(assets);
      return assets;
    } catch (error) {
      if (memory.assets.length) return memory.assets;
      throw error;
    }
  })().finally(() => { inflight = null; });
  return inflight;
}
