import { Router } from 'express';
import { getOnrampUrl } from '../services/onramp.js';

const router = Router();

router.get('/url', (req, res) => {
  const walletAddress = String(req.query.walletAddress || '').trim();
  const amount = req.query.amount ? String(req.query.amount) : undefined;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress is required' });

  try {
    res.json({ url: getOnrampUrl(walletAddress, amount) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
