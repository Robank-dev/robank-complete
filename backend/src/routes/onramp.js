import { Router } from 'express';
import { getOnrampUrl } from '../services/onramp.js';
import { requirePrivyWallet } from '../middleware/privyAuth.js';

const router = Router();

router.get('/url', async (req, res) => {
  const walletAddress = String(req.query.walletAddress || '').trim();
  const amount = req.query.amount ? String(req.query.amount) : undefined;
  const ownedWallet = await requirePrivyWallet(req, res, walletAddress);
  if (!ownedWallet) return;

  try {
    res.json({ url: getOnrampUrl(ownedWallet, amount) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
