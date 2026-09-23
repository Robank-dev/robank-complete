import { Router } from 'express';
import { chat } from '../services/agent.js';

const router = Router();

router.post('/chat', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-20) : [];
  const vaultAddress = req.body?.vaultAddress || null;
  if (!message) return res.status(400).json({ error: 'message is required' });

  try {
    res.json(await chat({ message, history, vaultAddress }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
