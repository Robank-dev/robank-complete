import { NextResponse } from 'next/server';

const STOCKS = [
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation' },
  { ticker: 'GOOGL', name: 'Alphabet Inc. Class A' },
  { ticker: 'MSFT', name: 'Microsoft Corporation' },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.' },
  { ticker: 'TSLA', name: 'Tesla, Inc.' },
  { ticker: 'META', name: 'Meta Platforms, Inc.' },
  { ticker: 'AVGO', name: 'Broadcom Inc.' }
];
const CRYPTO = ['BTC','ETH','SOL'];

async function yahoo(symbol: string) {
  const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`, {
    headers: { 'User-Agent': 'ROBANK/1.0' },
    next: { revalidate: 30 }
  });
  if (!response.ok) throw new Error(`Yahoo request failed: ${response.status}`);
  const data = await response.json();
  const meta = data?.chart?.result?.[0]?.meta;
  return {
    ticker: symbol,
    price: meta?.regularMarketPrice ?? meta?.previousClose ?? null,
    change: meta?.regularMarketChangePercent ?? null,
    timestamp: meta?.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString()
  };
}

async function coinbase(symbol: string) {
  const response = await fetch(`https://api.coinbase.com/v2/prices/${symbol}-USD/spot`, {
    headers: { 'User-Agent': 'ROBANK/1.0' },
    next: { revalidate: 15 }
  });
  if (!response.ok) throw new Error(`Coinbase request failed: ${response.status}`);
  const data = await response.json();
  return { ticker: symbol.toLowerCase(), price: Number(data?.data?.amount) || null, timestamp: new Date().toISOString() };
}

export async function GET() {
  try {
    const [stockQuotes, crypto] = await Promise.all([
      Promise.all(STOCKS.map((stock) => yahoo(stock.ticker))),
      Promise.all(CRYPTO.map(coinbase))
    ]);
    const stocks = stockQuotes.map((quote, index) => ({
      ...STOCKS[index],
      ...quote,
      ticker: STOCKS[index].ticker,
      assetClass: 'public-equity',
      instrumentType: 'stock',
      tokenized: false,
      market: 'US equities'
    }));
    return NextResponse.json({
      provider: 'yahoo-coinbase',
      generatedAt: new Date().toISOString(),
      stocks,
      crypto,
      tokenizedAssets: []
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Market provider failed' }, { status: 502 });
  }
}
