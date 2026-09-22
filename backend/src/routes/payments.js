import { Router } from 'express';
import { isAddress } from 'viem';
import { buildUsdcTransfer } from '../services/payment.js';

const router = Router();

router.post('/route', (req, res) => {
  const to = String(req.body?.to || '').trim();
  const amount = String(req.body?.amount || '').trim();
  const token = String(req.body?.token || 'USDC').toUpperCase();

  if (token !== 'USDC') return res.status(400).json({ error: 'Only USDC is enabled in this MVP.' });
  if (!isAddress(to)) return res.status(400).json({ error: 'Invalid recipient address.' });
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Invalid amount.' });

  try {
    res.json(buildUsdcTransfer({ to, amount }));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
