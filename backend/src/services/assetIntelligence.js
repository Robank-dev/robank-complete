import { listBaseOracles, getStockPrice } from '../integrations/xstocks/client.js';
import { discoverBaseVaults } from '../integrations/centrifuge/client.js';
import { listAssets as listRobinhoodAssets } from '../integrations/robinhood/client.js';

function normalizeXStock(node) {
  return {
    provider: 'xstocks',
    type: 'stock-token',
    network: 'base',
    symbol: node.symbol || node.metadata?.asset || null,
    name: node.name || node.metadata?.name || null,
    status: 'discoverable',
    pricing: {
      oracle: node.managedBy || null,
      quoteAsset: node.metadata?.quoteAsset || node.collateral?.priceCurrency || 'USD',
      feedId: node.metadata?.hermesId || null
    },
    collateral: node.collateral || null
  };
}

function normalizeCentrifuge(vault) {
  return {
    provider: 'centrifuge',
    type: 'rwa',
    network: 'base',
    symbol: vault.tokenId || null,
    name: null,
    status: vault.status || null,
    pricing: null,
    vaultId: vault.id || null,
    poolId: vault.poolId || null,
    assetAddress: vault.assetAddress || null,
    active: Boolean(vault.isActive)
  };
}

function normalizeRobinhood(asset) {
  return {
    provider: 'robinhood-chain',
    type: 'stock-token',
    network: 'robinhood',
    symbol: asset.tokenSymbol || null,
    name: asset.tokenName || null,
    status: asset.status || null,
    pricing: null,
    deployments: asset.deployments || [],
    multiplier: asset.currentMultiplier || null
  };
}

export async function discoverAssets() {
  const results = await Promise.allSettled([
    listBaseOracles({ page: 0, pageSize: 200 }),
    discoverBaseVaults({ limit: 200 }),
    listRobinhoodAssets()
  ]);

  const [xstocksResult, rwaResult, robinhoodResult] = results;

  const providers = {
    xstocks: {
      ok: xstocksResult.status === 'fulfilled',
      error: xstocksResult.status === 'rejected'
        ? xstocksResult.reason?.message || 'xStocks unavailable'
        : null
    },
    centrifuge: {
      ok: rwaResult.status === 'fulfilled',
      error: rwaResult.status === 'rejected'
        ? rwaResult.reason?.message || 'Centrifuge unavailable'
        : null
    },
    robinhood: {
      ok: robinhoodResult.status === 'fulfilled',
      error: robinhoodResult.status === 'rejected'
        ? robinhoodResult.reason?.message || 'Robinhood unavailable'
        : null
    }
  };

  const assets = [];

  if (xstocksResult.status === 'fulfilled') {
    for (const node of xstocksResult.value?.nodes || []) {
      assets.push(normalizeXStock(node));
    }
  }

  if (rwaResult.status === 'fulfilled') {
    for (const vault of rwaResult.value || []) {
      assets.push(normalizeCentrifuge(vault));
    }
  }

  if (robinhoodResult.status === 'fulfilled') {
    for (const asset of robinhoodResult.value?.assets || []) {
      assets.push(normalizeRobinhood(asset));
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    count: assets.length,
    providers,
    assets
  };
}

export async function getAssetBySymbol(symbol) {
  if (!symbol) throw new Error('symbol is required');

  const catalog = await discoverAssets();
  const normalized = String(symbol).toUpperCase();

  return catalog.assets.filter(
    (asset) => String(asset.symbol || '').toUpperCase() === normalized
  );
}
export async function getAssetQuote(symbol) {
  if (!symbol) throw new Error('symbol is required');

  const assets = await getAssetBySymbol(symbol);
  if (!assets.length) throw new Error('Asset not found: ' + symbol);

  const asset = assets.find((item) => item.provider === 'xstocks');
  if (!asset) throw new Error('Live quote unavailable for ' + symbol);

  const priceData = await getStockPrice(asset.symbol);

  return {
    symbol: asset.symbol,
    provider: asset.provider,
    network: asset.network,
    price: priceData?.quote ?? null,
    quoteAsset: asset.pricing?.quoteAsset || 'USD',
    oracle: asset.pricing?.oracle || null,
    feedId: asset.pricing?.feedId || null,
    generatedAt: new Date().toISOString()
  };
}
