import { Router } from 'express';
import { registerUser } from '../services/database.js';
import { requirePrivyWallet } from '../middleware/privyAuth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const walletAddress = String(req.body?.walletAddress || '').trim();
  const ownedWallet = await requirePrivyWallet(req, res, walletAddress);
  if (!ownedWallet) return;
  try {
    const user = await registerUser(ownedWallet);
    res.json({ ok: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
