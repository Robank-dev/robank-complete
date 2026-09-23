import { Router } from 'express';
import { config } from '../config.js';

const router = Router();

router.get('/', async (req, res) => {
  if (!config.tiingoApiKey) return res.status(503).json({ error:'News provider is not configured', provider:'tiingo', configure:'TIINGO_API_KEY' });
  try {
    const params = new URLSearchParams({ token: config.tiingoApiKey, limit: String(Math.min(Number(req.query.limit)||30,50)), sortBy:'crawlDate', sortOrder:'desc' });
    if (req.query.tickers) params.set('tickers', String(req.query.tickers).toLowerCase());
    const response=await fetch(`https://api.tiingo.com/tiingo/news?${params}`);
    const data=await response.json();
    if(!response.ok) return res.status(502).json({error:data?.detail||'Tiingo news request failed'});
    const items=Array.isArray(data)?data:[];
    res.json({provider:'tiingo',generatedAt:new Date().toISOString(),news:items.map(item=>({id:item.id,title:item.title,url:item.url,description:item.description||'',publishedDate:item.publishedDate,source:item.source,tickers:item.tickers||[],tags:item.tags||[]}))});
  } catch(error){res.status(502).json({error:error.message});}
});

export default router;
