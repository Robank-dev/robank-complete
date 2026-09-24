import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { createCompany, listCompanies, getCompany, updateCompany } from '../services/database.js';
import { requirePrivyWallet } from '../middleware/privyAuth.js';

const router = Router();
const requireWallet = (req) => String(req.body?.walletAddress || req.query?.walletAddress || '').trim().toLowerCase();

router.get('/', async (req, res) => {
  try {
    const requestedWallet = requireWallet(req);
    const wallet = await requirePrivyWallet(req, res, requestedWallet);
    if (!wallet) return;
    res.json({ companies: await listCompanies(wallet) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', async (req, res) => {
  try {
    const requestedWallet = requireWallet(req);
    const wallet = await requirePrivyWallet(req, res, requestedWallet);
    if (!wallet) return;
    const legalName = String(req.body?.legalName || '').trim();
    const countryCode = String(req.body?.countryCode || 'ID').trim().toUpperCase();
    const metadata = req.body?.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {};
    if (!wallet || !legalName || !countryCode) return res.status(400).json({ error: 'walletAddress, legalName and countryCode are required' });
    const company = await createCompany({ ownerWallet: wallet, legalName, registrationNumber: req.body?.registrationNumber || null, countryCode, metadata });
    res.status(201).json({ company });
  } catch (error) { res.status(400).json({ error: error.message }); }
});

router.post('/:id/verify', async (req, res) => {
  try {
    const requestedWallet = requireWallet(req);
    const wallet = await requirePrivyWallet(req, res, requestedWallet);
    if (!wallet) return;
    const company = await getCompany(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (company.owner_wallet !== wallet) return res.status(403).json({ error: 'Company access denied' });
    if (!config.diditApiKey || !config.diditKybWorkflowId) return res.status(503).json({ error: 'Didit KYB is not configured. Set DIDIT_API_KEY and DIDIT_KYB_WORKFLOW_ID.' });
    const response = await fetch('https://verification.didit.me/v3/session/', { method:'POST', headers:{'x-api-key':config.diditApiKey,'Content-Type':'application/json'}, body:JSON.stringify({ workflow_id:config.diditKybWorkflowId, vendor_data:`robank-company-${company.id}` }) });
    const data = await response.json();
    if (!response.ok) return res.status(502).json({ error: data?.detail || data?.message || 'Didit session creation failed' });
    const updated = await updateCompany(company.id, { status:'verification_pending', verificationStatus:'pending', diditSessionId:data.session_id, metadata:{ verificationUrl:data.url || null, provider:'didit', session:data } });
    res.json({ company: updated, verification: { provider:'didit', sessionId:data.session_id, url:data.url } });
  } catch (error) { res.status(502).json({ error: error.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const requestedWallet = requireWallet(req);
    const wallet = await requirePrivyWallet(req, res, requestedWallet);
    if (!wallet) return;
    const company = await getCompany(req.params.id);
    if (!company) return res.status(404).json({ error:'Company not found' });
    const owner = String(company.owner_wallet || company.ownerWallet || '').toLowerCase();
    if (owner !== wallet) return res.status(403).json({ error:'Company access denied' });
    res.json({ company });
  } catch (error) { res.status(500).json({ error:error.message }); }
});

export default router;
