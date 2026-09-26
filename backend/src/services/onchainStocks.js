import { listBaseOracles } from '../integrations/xstocks/client.js';
import { listAssets as listRobinhoodAssets, getAssetPrice } from '../integrations/robinhood/client.js';

const NASDAQ_URL = 'https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=5000';
const XSTOCKS_URL = 'https://api.xstocks.fi/api/v2/public/assets';
const SNAPSHOT_TTL_MS = 60_000;
const PRICE_CONCURRENCY = 20;

let cache = { at: 0, value: null };
let inFlight = null;

function parseMoney(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const n = Number(value.replace(/[$,%s,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function parsePercent(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const n = Number(value.replace(/[%+s,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function formatXstockLogo(symbol) {
  return `https://xstocks-metadata.backed.fi/logos/tokens/${encodeURIComponent(symbol)}.png`;
}

function normalizeNasdaq(rows) {
  const map = new Map();
  for (const row of rows || []) {
    const ticker = String(row.symbol || '').trim().toUpperCase();
    if (!ticker || map.has(ticker)) continue;
    map.set(ticker, {
      price: parseMoney(row.lastsale),
      marketCap: parseMoney(row.marketCap),
      changePercent: parsePercent(row.pctchange),
      change: parseMoney(row.netchange)
    });
  }
  return map;
}

async function fetchNasdaq() {
  const response = await fetch(NASDAQ_URL, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ROBANK/1.0'
    }
  });
  if (!response.ok) throw new Error(`Nasdaq screener failed: ${response.status}`);
  const data = await response.json();
  return normalizeNasdaq(data?.data?.table?.rows || []);
}

async function fetchXstockCatalog(network) {
  const data = await listBaseOracles({ page: 0, pageSize: 200, network });
  return (data?.nodes || [])
    .filter((node) => node?.symbol)
    .map((node) => ({
      provider: 'xstocks',
      network: network === 'Solana' ? 'Solana' : 'Base',
      networkKey: network.toLowerCase(),
      symbol: String(node.symbol),
      name: node.name || node.symbol,
      ticker: String(node.collateral?.symbol || node.symbol).toUpperCase(),
      logo: formatXstockLogo(String(node.symbol)),
      status: 'active'
    }));
}

async function fetchXstockPrice(symbol) {
  try {
    const response = await fetch(
      `${XSTOCKS_URL}/${encodeURIComponent(symbol)}/price-data`,
      { headers: { Accept: 'application/json', 'User-Agent': 'ROBANK/1.0' } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    const price = parseMoney(data?.quote);
    return price != null && price > 0 ? price : null;
  } catch {
    return null;
  }
}

async function mapWithConcurrency(items, mapper, concurrency = PRICE_CONCURRENCY) {
  const out = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      out[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return out;
}

async function buildXstocks(catalog, nasdaq) {
  const uniqueSymbols = [...new Set(catalog.map((item) => item.symbol))];
  const prices = new Map();
  const fetched = await mapWithConcurrency(uniqueSymbols, async (symbol) => [symbol, await fetchXstockPrice(symbol)]);
  for (const [symbol, price] of fetched) prices.set(symbol, price);

  return catalog.map((item) => {
    const market = nasdaq.get(item.ticker) || {};
    const price = prices.get(item.symbol) ?? market.price ?? null;
    return {
      ...item,
      price,
      marketCap: market.marketCap ?? null,
      changePercent: market.changePercent ?? null,
      change: market.change ?? null,
      changeSource: market.changePercent != null ? 'Nasdaq' : null,
      priceSource: prices.get(item.symbol) != null ? 'xStocks' : 'Nasdaq'
    };
  });
}

async function buildRobinhood(nasdaq) {
  const response = await listRobinhoodAssets();
  const assets = (response?.assets || []).filter(
    (asset) => asset?.tokenSymbol && asset?.status === 'ASSET_STATUS_ACTIVE'
  );

  const rows = await mapWithConcurrency(assets, async (asset) => {
    const ticker = String(asset.tokenSymbol).toUpperCase();
    const market = nasdaq.get(ticker) || {};
    let tokenPrice = null;

    try {
      const quote = await getAssetPrice(ticker);
      const row = quote?.quotes?.[0];
      const bid = parseMoney(row?.tokenBid);
      const ask = parseMoney(row?.tokenAsk);
      tokenPrice = bid != null && ask != null
        ? (bid + ask) / 2
        : bid ?? ask ?? parseMoney(row?.bid) ?? parseMoney(row?.ask) ?? null;
    } catch {
      tokenPrice = null;
    }

    return {
      provider: 'robinhood',
      network: 'Robinhood Chain',
      networkKey: 'robinhood',
      symbol: ticker,
      ticker,
      name: String(asset.tokenName || ticker).replace(/\s*•\s*Robinhood Token$/i, ''),
      logo: asset.logoUrl || null,
      contractAddress: asset.deployments?.find((d) => Number(d.chainId) === 4663)?.contractAddress || null,
      price: tokenPrice ?? market.price ?? null,
      marketCap: market.marketCap ?? null,
      changePercent: market.changePercent ?? null,
      change: market.change ?? null,
      changeSource: market.changePercent != null ? 'Nasdaq' : null,
      priceSource: tokenPrice != null ? 'Robinhood' : 'Nasdaq'
    };
  });

  return rows;
}

export async function getOnchainStocks() {
  const now = Date.now();
  if (cache.value && now - cache.at < SNAPSHOT_TTL_MS) return cache.value;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const [nasdaq, base, solana] = await Promise.all([
      fetchNasdaq(),
      fetchXstockCatalog('Base'),
      fetchXstockCatalog('Solana')
    ]);

    const [baseRows, solanaRows, robinhoodRows] = await Promise.all([
      buildXstocks(base, nasdaq),
      buildXstocks(solana, nasdaq),
      buildRobinhood(nasdaq)
    ]);

    const stocks = [...baseRows, ...solanaRows, ...robinhoodRows]
      .filter((row) => row.price != null || row.marketCap != null)
      .sort((a, b) => (b.marketCap ?? -1) - (a.marketCap ?? -1));

    const result = {
      generatedAt: new Date().toISOString(),
      provider: 'xStocks + Robinhood + Nasdaq',
      networks: { base: baseRows.length, solana: solanaRows.length, robinhood: robinhoodRows.length },
      count: stocks.length,
      stocks
    };
    cache = { at: Date.now(), value: result };
    return result;
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

