import { Router } from 'express';
import { getOnchainStocks } from '../services/onchainStocks.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=30');
    res.json(await getOnchainStocks());
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Onchain stock data unavailable'
    });
  }
});

export default router;
