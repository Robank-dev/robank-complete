const XSTOCKS_URL = 'https://api.xstocks.fi/api/v2/public/assets';

export type XStockDeployment = {
  chainId: number;
  network: string;
  address: string;
  decimals: number;
};

export type XStockAsset = {
  id: string;
  symbol: string;
  name: string;
  logo: string;
  underlyingSymbol: string;
  deployments: XStockDeployment[];
};

const NETWORK_TO_CHAIN: Record<string, number> = {
  Ethereum: 1,
  Base: 8453,
  Arbitrum: 42161,
  Optimism: 10,
  Polygon: 137,
  BinanceSmartChain: 56,
  Robinhood: 4663,
  Solana: 1151111081099710,
};

let cache: { at: number; assets: XStockAsset[] } = { at: 0, assets: [] };

async function fetchPage(page: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${XSTOCKS_URL}?page=${page}&pageSize=100`, {
      headers: { Accept: 'application/json', 'User-Agent': 'ROBANK/1.0' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`xStocks provider failed: ${response.status}`);
    return await response.json() as {
      nodes?: any[];
      page?: { hasNextPage?: boolean };
    };
  } finally {
    clearTimeout(timer);
  }
}

function normalize(node: any): XStockAsset | null {
  const symbol = String(node?.symbol || '').trim();
  if (!symbol) return null;
  const deployments: XStockDeployment[] = [];
  for (const item of Array.isArray(node?.deployments) ? node.deployments : []) {
    const network = String(item?.network || '');
    const chainId = NETWORK_TO_CHAIN[network];
    const address = String(item?.address || '');
    if (!chainId || !address) continue;
    deployments.push({
      chainId,
      network,
      address,
      // xStocks EVM contracts are ERC-20 compatible; Solana uses Token-2022.
      decimals: 18,
    });
  }
  return {
    id: String(node?.id || symbol),
    symbol,
    name: String(node?.name || node?.metadata?.name || symbol),
    logo: String(node?.logo || `https://xstocks-metadata.backed.fi/logos/tokens/${encodeURIComponent(symbol)}.png`),
    underlyingSymbol: String(node?.underlyingSymbol || node?.collateral?.symbol || symbol).toUpperCase(),
    deployments,
  };
}

export async function getXStocksCatalog(force = false): Promise<XStockAsset[]> {
  if (!force && Date.now() - cache.at < 10 * 60_000 && cache.assets.length) return cache.assets;

  const first = await fetchPage(0);
  const pages: Array<{ nodes?: any[]; page?: { hasNextPage?: boolean } }> = [first];

  if (first.page?.hasNextPage) {
    const batch = await Promise.all(
      Array.from({ length: 9 }, (_, index) => fetchPage(index + 1).catch(() => ({ nodes: [], page: { hasNextPage: false } })))
    );
    pages.push(...batch);
    const needsSecondBatch = batch[8]?.page?.hasNextPage;
    if (needsSecondBatch) {
      const second = await Promise.all(
        Array.from({ length: 10 }, (_, index) => fetchPage(index + 10).catch(() => ({ nodes: [], page: { hasNextPage: false } })))
      );
      pages.push(...second);
    }
  }

  const seen = new Set<string>();
  const assets: XStockAsset[] = [];
  for (const page of pages) {
    for (const node of page.nodes || []) {
      const asset = normalize(node);
      if (!asset || seen.has(asset.id)) continue;
      seen.add(asset.id);
      assets.push(asset);
    }
  }

  cache = { at: Date.now(), assets };
  return assets;
}

export const XSTOCKS_NETWORKS = NETWORK_TO_CHAIN;
