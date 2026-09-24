import { Router } from 'express';
import { config } from '../config.js';
import { createUpdate, listUpdates, deleteUpdate } from '../services/database.js';
import { requirePrivyWallet } from '../middleware/privyAuth.js';

const router = Router();

function ownerWallet(req) {
  return String(req.body?.walletAddress || req.query?.walletAddress || '').trim().toLowerCase();
}

async function requireOwner(req, res) {
  const requestedWallet = ownerWallet(req);
  const wallet = await requirePrivyWallet(req, res, requestedWallet);
  if (!wallet) return null;
  if (!config.robankOwnerWallet) {
    res.status(503).json({ error: 'ROBANK owner wallet is not configured.' });
    return null;
  }
  if (!wallet || wallet !== config.robankOwnerWallet) {
    res.status(403).json({ error: 'Owner access required.' });
    return null;
  }
  return wallet;
}
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const updates = await listUpdates({ limit });
    res.json({ provider: 'robank-owner-feed', generatedAt: new Date().toISOString(), updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const wallet = await requireOwner(req, res);
    if (!wallet) return;
    const body = String(req.body?.body || '').trim();
    const title = String(req.body?.title || '').trim() || null;
    const xUrl = String(req.body?.xUrl || '').trim() || null;
    const imageUrl = String(req.body?.imageUrl || '').trim() || null;
    if (!body) return res.status(400).json({ error: 'body is required' });
    const update = await createUpdate({ authorWallet: wallet, title, body, xUrl, imageUrl });
    res.status(201).json({ update });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    const wallet = await requireOwner(req, res);
    if (!wallet) return;
    const update = await deleteUpdate(req.params.id, wallet);
    if (!update) return res.status(404).json({ error: 'Update not found.' });
    res.json({ update });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
