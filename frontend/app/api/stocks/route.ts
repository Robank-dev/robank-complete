import { NextResponse } from 'next/server';

const NASDAQ_URL = 'https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=5000';
const XSTOCKS_BASE = 'https://api.xstocks.fi/api/v2/public/oracles?network=Base&page=0&pageSize=200';
const XSTOCKS_SOLANA = 'https://api.xstocks.fi/api/v2/public/oracles?network=Solana&page=0&pageSize=200';
const ROBINHOOD_URL = 'https://api.robinhood.com/rhj/assets';

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'ROBANK/1.0'
    },
    next: { revalidate: 60 }
  });
  const text = await response.text();
  let data: any = null;
  if (text) {
    try { data = JSON.parse(text); } catch { throw new Error('Provider returned invalid JSON'); }
  }
  if (!response.ok) throw new Error(data?.message || data?.error || `Provider request failed: ${response.status}`);
  return data;
}

function numberValue(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const n = Number(value.replace(/[$,%\s,]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function nasdaqMap(rows: any[]) {
  const map = new Map<string, { price: number | null; marketCap: number | null; changePercent: number | null }>();
  for (const row of rows || []) {
    const ticker = String(row?.symbol || '').trim().toUpperCase();
    if (!ticker || map.has(ticker)) continue;
    map.set(ticker, {
      price: numberValue(row?.lastsale),
      marketCap: numberValue(row?.marketCap),
      changePercent: numberValue(row?.pctchange)
    });
  }
  return map;
}

function xstockRows(
  nodes: any[],
  network: 'Base' | 'Solana',
  market: Map<string, { price: number | null; marketCap: number | null; changePercent: number | null }>
) {
  return (nodes || []).filter((node) => node?.symbol).map((node) => {
    const symbol = String(node.symbol);
    const ticker = String(node.collateral?.symbol || symbol).toUpperCase();
    const quote = market.get(ticker);
    return {
      provider: 'xstocks',
      network: network === 'Base' ? 'Base' : 'Solana',
      networkKey: network === 'Base' ? 'base' : 'solana',
      symbol,
      ticker,
      name: String(node.name || node.metadata?.name || symbol),
      logo: `https://xstocks-metadata.backed.fi/logos/tokens/${encodeURIComponent(symbol)}.png`,
      price: quote?.price ?? null,
      marketCap: quote?.marketCap ?? null,
      changePercent: quote?.changePercent ?? null,
      priceSource: 'Underlying listing',
      changeSource: 'Nasdaq'
    };
  });
}

function robinhoodRows(
  assets: any[],
  market: Map<string, { price: number | null; marketCap: number | null; changePercent: number | null }>
) {
  return (assets || [])
    .filter((asset) => asset?.tokenSymbol && asset?.status === 'ASSET_STATUS_ACTIVE')
    .map((asset) => {
      const ticker = String(asset.tokenSymbol).toUpperCase();
      const quote = market.get(ticker);
      const deployment = asset.deployments?.find((item: any) => Number(item?.chainId) === 4663);
      return {
        provider: 'robinhood',
        network: 'Robinhood Chain',
        networkKey: 'robinhood',
        symbol: ticker,
        ticker,
        name: String(asset.tokenName || ticker).replace(/\s*•\s*Robinhood Token$/i, ''),
        logo: asset.logoUrl || null,
        contractAddress: deployment?.contractAddress || null,
        price: quote?.price ?? null,
        marketCap: quote?.marketCap ?? null,
        changePercent: quote?.changePercent ?? null,
        priceSource: 'Underlying listing',
        changeSource: 'Nasdaq'
      };
    });
}

export async function GET() {
  try {
    const [nasdaq, base, solana, robinhood] = await Promise.all([
      fetchJson(NASDAQ_URL),
      fetchJson(XSTOCKS_BASE),
      fetchJson(XSTOCKS_SOLANA),
      fetchJson(ROBINHOOD_URL)
    ]);

    const market = nasdaqMap(nasdaq?.data?.table?.rows || []);

    const merged = [
      ...xstockRows(base?.nodes || [], 'Base', market),
      ...xstockRows(solana?.nodes || [], 'Solana', market),
      ...robinhoodRows(robinhood?.assets || [], market)
    ];
    const seen = new Set<string>();
    const stocks = merged.filter((row) => {
      const key = `${row.networkKey}:${row.symbol}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => (b.marketCap ?? -1) - (a.marketCap ?? -1));

    const networkCounts = {
      base: stocks.filter((row) => row.networkKey === 'base').length,
      solana: stocks.filter((row) => row.networkKey === 'solana').length,
      robinhood: stocks.filter((row) => row.networkKey === 'robinhood').length
    };

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      provider: 'xStocks + Robinhood + Nasdaq',
      networks: networkCounts,
      count: stocks.length,
      stocks
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60' }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Stock market data unavailable' },
      { status: 502 }
    );
  }
}

