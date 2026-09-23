import { Router } from 'express';
import { config } from '../config.js';
import { discoverAssets } from '../services/assetIntelligence.js';

const router = Router();
const DEFAULT_STOCKS=['AAPL','MSFT','NVDA','TSLA','AMZN'];
const DEFAULT_CRYPTO=['btcusd','ethusd','solusd'];

async function tiingo(path){
  if(!config.tiingoApiKey) throw new Error('Market provider is not configured');
  const response=await fetch(`https://api.tiingo.com${path}${path.includes('?')?'&':'?'}token=${encodeURIComponent(config.tiingoApiKey)}`);
  const data=await response.json(); if(!response.ok) throw new Error(data?.detail||'Tiingo market request failed'); return data;
}

router.get('/', async (req,res)=>{
  try {
    const stocks=String(req.query.stocks||DEFAULT_STOCKS.join(',')).split(',').map(x=>x.trim().toUpperCase()).filter(Boolean).slice(0,20);
    const crypto=String(req.query.crypto||DEFAULT_CRYPTO.join(',')).split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).slice(0,20);
    const result={provider:'tiingo',generatedAt:new Date().toISOString(),stocks:[],crypto:[],rwa:[]};
    if(config.tiingoApiKey){
      const [stockData,cryptoData]=await Promise.all([tiingo(`/tiingo/equity/intraday?tickers=${encodeURIComponent(stocks.join(','))}`),tiingo(`/tiingo/crypto/prices?tickers=${encodeURIComponent(crypto.join(','))}`)]);
      result.stocks=(Array.isArray(stockData)?stockData:[]).map(x=>({ticker:x.ticker,price:x.tngoLast??x.last??null,change:x.percentChange??null,timestamp:x.timestamp}));
      result.crypto=(Array.isArray(cryptoData)?cryptoData:[]).map(x=>({ticker:x.ticker,price:x.last??x.lastPrice??null,timestamp:x.timestamp}));
    }
    try { const discovered=await discoverAssets(); result.rwa=discovered.assets.filter(x=>/rwa|stock|gold|commodity/i.test(`${x.type} ${x.name||''} ${x.symbol||''}`)).slice(0,30); } catch { result.rwa=[]; }
    res.json(result);
  } catch(error){res.status(502).json({error:error.message,provider:'tiingo'});}
});

export default router;
