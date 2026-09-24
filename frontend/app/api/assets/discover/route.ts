import { NextResponse } from 'next/server';

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'ROBANK/1.0' },
    next: { revalidate: 60 }
  });
  const text = await response.text();
  let data: any = null;
  if (text) {
    try { data = JSON.parse(text); } catch { throw new Error(`Invalid JSON from ${url}`); }
  }
  if (!response.ok) throw new Error(data?.message || data?.error || `Provider request failed: ${response.status}`);
  return data;
}

function normalizeXStock(node: any) {
  return {
    provider: 'xstocks',
    type: 'stock-token',
    network: 'base',
    symbol: node.symbol || node.metadata?.asset || null,
    name: node.name || node.metadata?.name || null,
    status: 'discoverable',
    pricing: {
      oracle: node.managedBy || null,
      quoteAsset: node.metadata?.quoteAsset || 'USD',
      feedId: node.metadata?.hermesId || null
    },
    collateral: node.collateral || null
  };
}

function normalizeRobinhood(asset: any) {
  return {
    provider: 'robinhood-chain',
    type: 'stock-token',
    network: 'robinhood',
    symbol: asset.tokenSymbol || null,
    name: asset.tokenName || null,
    status: asset.status || null,
    deployments: asset.deployments || [],
    multiplier: asset.currentMultiplier || null
  };
}

export async function GET() {
  const [xstocksResult, robinhoodResult] = await Promise.allSettled([
    fetchJson('https://api.xstocks.fi/api/v2/public/oracles?network=Base&page=0&pageSize=200'),
    fetchJson('https://api.robinhood.com/rhj/assets')
  ]);

  const assets = [
    ...(xstocksResult.status === 'fulfilled'
      ? (xstocksResult.value?.nodes || []).map(normalizeXStock)
      : []),
    ...(robinhoodResult.status === 'fulfilled'
      ? (robinhoodResult.value?.assets || []).map(normalizeRobinhood)
      : [])
  ];

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    count: assets.length,
    providers: {
      xstocks: {
        ok: xstocksResult.status === 'fulfilled',
        error: xstocksResult.status === 'rejected'
          ? String(xstocksResult.reason?.message || 'xStocks unavailable')
          : null
      },
      robinhood: {
        ok: robinhoodResult.status === 'fulfilled',
        error: robinhoodResult.status === 'rejected'
          ? String(robinhoodResult.reason?.message || 'Robinhood Stock Token API unavailable')
          : null
      },
      centrifuge: {
        ok: false,
        error: 'No local web discovery route configured'
      }
    },
    assets
  });
}
