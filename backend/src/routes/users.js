import { Router } from 'express';
import { registerUser } from '../services/database.js';

const router = Router();

router.post('/register', async (req, res) => {
  const walletAddress = String(req.body?.walletAddress || '').trim();
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress is required' });
  try {
    const user = await registerUser(walletAddress);
    res.json({ ok: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
