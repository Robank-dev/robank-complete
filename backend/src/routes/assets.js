import { Router } from 'express';
import { discoverAssets, getAssetBySymbol, getAssetQuote } from '../services/assetIntelligence.js';

const router = Router();

router.get('/discover', async (_req, res) => {
  try {
    const data = await discoverAssets();
    res.json(data);
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

router.get('/inspect/:symbol', async (req, res) => {
  try {
    const assets = await getAssetBySymbol(req.params.symbol);

    res.json({
      symbol: req.params.symbol.toUpperCase(),
      count: assets.length,
      assets
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
});


router.get('/quote/:symbol', async (req, res) => {
  try {
    res.json(await getAssetQuote(req.params.symbol));
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
});
export default router;

