import { Router } from 'express';
import { config } from '../config.js';
import { discoverAssets } from '../services/assetIntelligence.js';

const router = Router();
const STOCK_CATALOG = [
  { ticker: 'AAPL', name: 'Apple Inc.' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation' },
  { ticker: 'GOOGL', name: 'Alphabet Inc. Class A' },
  { ticker: 'MSFT', name: 'Microsoft Corporation' },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.' },
  { ticker: 'TSLA', name: 'Tesla, Inc.' },
  { ticker: 'META', name: 'Meta Platforms, Inc.' },
  { ticker: 'AVGO', name: 'Broadcom Inc.' }
];
const DEFAULT_STOCKS=STOCK_CATALOG.map((stock)=>stock.ticker);
const DEFAULT_CRYPTO=['btcusd','ethusd','solusd'];

async function tiingo(path){
  if(!config.tiingoApiKey) throw new Error('Market provider is not configured');
  const response=await fetch(`https://api.tiingo.com${path}${path.includes('?')?'&':'?'}token=${encodeURIComponent(config.tiingoApiKey)}`);
  const data=await response.json(); if(!response.ok) throw new Error(data?.detail||'Tiingo market request failed'); return data;
}

async function yahooQuote(symbol){
  const response=await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`,{headers:{'User-Agent':'ROBANK/1.0'}});
  const data=await response.json();
  if(!response.ok) throw new Error(data?.chart?.error?.description||'Yahoo market request failed');
  const meta=data?.chart?.result?.[0]?.meta;
  return {ticker:symbol,price:meta?.regularMarketPrice??meta?.previousClose??null,change:meta?.regularMarketChangePercent??null,timestamp:meta?.regularMarketTime?new Date(meta.regularMarketTime*1000).toISOString():new Date().toISOString()};
}

async function binanceQuotes(symbols){
  const query=encodeURIComponent(JSON.stringify(symbols.map(x=>x.toUpperCase())));
  const response=await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${query}`,{headers:{'User-Agent':'ROBANK/1.0'}});
  const data=await response.json();
  if(!response.ok) throw new Error(data?.msg||'Binance market request failed');
  return (Array.isArray(data)?data:[]).map(x=>({ticker:String(x.symbol||'').replace(/USDT$/,'').toLowerCase(),price:Number(x.lastPrice),change:Number(x.priceChangePercent),timestamp:new Date().toISOString()}));
}

router.get('/', async (req,res)=>{
  try {
    const stocks=String(req.query.stocks||DEFAULT_STOCKS.join(',')).split(',').map(x=>x.trim().toUpperCase()).filter(Boolean).slice(0,20);
    const crypto=String(req.query.crypto||DEFAULT_CRYPTO.join(',')).split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).slice(0,20);
    const result={provider:config.tiingoApiKey?'tiingo':'yahoo-binance',generatedAt:new Date().toISOString(),stocks:[],crypto:[],rwa:[]};
    if(config.tiingoApiKey){
      const [stockData,cryptoData]=await Promise.all([tiingo(`/tiingo/equity/intraday?tickers=${encodeURIComponent(stocks.join(','))}`),tiingo(`/tiingo/crypto/prices?tickers=${encodeURIComponent(crypto.join(','))}`)]);
      result.stocks=(Array.isArray(stockData)?stockData:[]).map(x=>({ticker:x.ticker,price:x.tngoLast??x.last??null,change:x.percentChange??null,timestamp:x.timestamp}));
      result.crypto=(Array.isArray(cryptoData)?cryptoData:[]).map(x=>({ticker:x.ticker,price:x.last??x.lastPrice??null,timestamp:x.timestamp}));
    } else {
      const [stockData, cryptoData] = await Promise.all([
        Promise.all(stocks.map(yahooQuote)),
        binanceQuotes(crypto.map(x => x.endsWith('usd') ? x.replace(/usd$/i,'usdt') : x + 'usdt'))
      ]);
      result.stocks=stockData;
      result.crypto=cryptoData;
    }
    result.stocks = result.stocks.map((stock) => {
      const catalog = STOCK_CATALOG.find((item) => item.ticker === String(stock.ticker || '').toUpperCase());
      return {
        ...catalog,
        ...stock,
        ticker: String(stock.ticker || catalog?.ticker || '').toUpperCase(),
        assetClass: 'public-equity',
        instrumentType: 'stock',
        tokenized: false,
        market: 'US equities'
      };
    });
    try { const discovered=await discoverAssets(); result.rwa=discovered.assets.filter(x=>/rwa|stock|gold|commodity/i.test(`${x.type} ${x.name||''} ${x.symbol||''}`)).slice(0,30); } catch { result.rwa=[]; }
    res.json(result);
  } catch(error){res.status(502).json({error:error.message,provider:config.tiingoApiKey?'tiingo':'yahoo-binance'});}
});

export default router;
