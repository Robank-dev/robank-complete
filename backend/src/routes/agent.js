import { isAddress, isHash } from 'viem';
import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { chat } from '../services/agent.js';
import { getAgentPolicy, isPolicyExpired } from '../services/agentPolicy.js';
import { listScheduledJobs } from '../services/agentScheduler.js';
import { config } from '../config.js';
import { prepareAgentAction } from '../services/agentExecution.js';
import { buildTokenTransfer } from '../services/payment.js';
import { beginTransaction, markSubmitted, confirmTransaction, failTransaction } from '../services/reconciliation.js';
import { getLedgerTransactionByIdempotencyKey } from '../services/database.js';
import { verifyMainnetTransaction } from '../services/transactionVerification.js';

const router = Router();

router.get('/status', (_req, res) => {
  const policy = getAgentPolicy('status');
  const jobs = listScheduledJobs();
  const scheduledJobs = jobs.filter((job) => job.scheduled);
  res.json({
    agent: { status: 'available', chat: { status: config.robankLlmApiKey ? 'llm-configured' : 'local-fallback', model: config.robankLlmModel, baseUrl: config.robankLlmBaseUrl }, execution: { status: 'executor-required', foundation: 'available', autonomous: false } },
    policy: { autoExecute: policy.autoExecute, revoked: policy.revoked, expired: isPolicyExpired(policy), perTransactionLimitUsd: policy.perTransactionLimitUsd, dailyLimitUsd: policy.dailyLimitUsd, monthlyLimitUsd: policy.monthlyLimitUsd, liquidityFloorUsd: policy.liquidityFloorUsd, maxLtv: policy.maxLtv, approvalThresholdUsd: policy.approvalThresholdUsd, allowedAssets: policy.allowedAssets, allowedNetworks: policy.allowedNetworks, approvedProviders: policy.approvedProviders },
    scheduler: { status: scheduledJobs.length > 0 ? 'running' : 'stopped', registeredJobCount: jobs.length, scheduledJobCount: scheduledJobs.length, jobs },
    providers: { execution: 'not-connected', card: 'provider-dependent', rwa: 'provider-dependent', credit: 'morpho' }
  });
});
router.post('/prepare', async (req, res) => {
  const walletAddress = String(req.body?.walletAddress || '').trim();
  const destination = String(req.body?.destination || '').trim();
  const amount = String(req.body?.amount || '').trim();
  const asset = String(req.body?.asset || 'USDC').toUpperCase();
  const network = String(req.body?.network || '').toLowerCase();

  if (!isAddress(walletAddress)) return res.status(400).json({ error: 'Valid walletAddress is required.' });
  if (!isAddress(destination)) return res.status(400).json({ error: 'Valid destination is required.' });
  if (!['USDC', 'USDG'].includes(asset)) return res.status(400).json({ error: 'Unsupported execution asset.' });
  if (!['base', 'robinhood'].includes(network)) return res.status(400).json({ error: 'Unsupported execution network.' });
  if ((network === 'base' && asset !== 'USDC') || (network === 'robinhood' && asset !== 'USDG')) return res.status(400).json({ error: `${asset} is not enabled on ${network}.` });
  if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ error: 'Invalid amount.' });

  try {
    const prepared = await prepareAgentAction({ walletAddress, actionType: 'transfer', amountUsd: Number(amount), asset, network, provider: 'onchain', metadata: { destination, direction: 'outgoing' } });
    const response = { stage: prepared.stage, prepared, transaction: null };
    if (prepared.policy.allowed) {
      response.stage = prepared.policy.requiresApproval ? 'awaiting-user-confirmation' : 'prepared-for-wallet-signing';
      response.transaction = buildTokenTransfer({ network, token: asset, to: destination, amount });
    }
    res.json(response);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});
router.post('/confirm', async (req, res) => {
  const walletAddress = String(req.body?.walletAddress || '').trim();
  const destination = String(req.body?.destination || '').trim();
  const amount = String(req.body?.amount || '').trim();
  const network = String(req.body?.network || 'base').toLowerCase();
  const asset = String(req.body?.asset || (network === 'robinhood' ? 'USDG' : 'USDC')).toUpperCase();
  const txHash = String(req.body?.txHash || '').trim();

  if (!isAddress(walletAddress)) return res.status(400).json({ error: 'Valid walletAddress is required.' });
  if (!isAddress(destination)) return res.status(400).json({ error: 'Valid destination is required.' });
  if (!['base', 'robinhood'].includes(network)) return res.status(400).json({ error: 'Unsupported network.' });
  if ((network === 'base' && asset !== 'USDC') || (network === 'robinhood' && asset !== 'USDG')) return res.status(400).json({ error: `${asset} is not enabled on ${network}.` });
  if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ error: 'Invalid amount.' });
  if (!isHash(txHash)) return res.status(400).json({ error: 'Valid transaction hash is required.' });

  const idempotencyKey = `agent-tx:${txHash.toLowerCase()}`;
  try {
    const existing = await getLedgerTransactionByIdempotencyKey(idempotencyKey);
    if (existing?.status === 'confirmed') return res.json({ stage: 'completed', ledger: existing, verified: true, idempotent: true });
    if (existing?.status === 'failed') return res.status(409).json({ stage: 'failed', ledger: existing, verified: false, idempotent: true });

    const ledger = existing || await beginTransaction({ walletAddress, kind: 'transfer', asset, amountDelta: `-${Number(amount)}`, network, provider: 'onchain', idempotencyKey, metadata: { agent: true, destination, direction: 'outgoing', execution: 'wallet-signed' } });
    const submitted = await markSubmitted(ledger.id, { externalId: txHash, metadata: { agent: true, destination, direction: 'outgoing', execution: 'wallet-signed', txHash } });
    let verification;
    try {
      verification = await verifyMainnetTransaction(txHash, { walletAddress, destination, amount, network, asset });
    } catch (error) {
      return res.status(202).json({ stage: 'submitted', ledger: submitted, verified: false, requiresReconciliation: true, verificationError: error.message });
    }

    if (!verification.verified) {
      const failed = await failTransaction(submitted.id, { agent: true, stage: 'verification-failed', verification });
      return res.status(400).json({ stage: 'failed', ledger: failed, verified: false, verification });
    }

    const confirmed = await confirmTransaction(submitted.id, {
      externalId: txHash,
      metadata: { agent: true, destination, direction: 'outgoing', execution: 'wallet-signed', stage: 'verified', verification }
    });
    return res.json({ stage: 'completed', ledger: confirmed, verified: true, verification });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});
router.post('/chat', async (req, res) => {
  const message = String(req.body?.message || '').trim();
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-20) : [];
  const vaultAddress = req.body?.vaultAddress || null;
  const walletAddress = req.body?.walletAddress || null;
  const context = req.body?.context && typeof req.body.context === 'object' ? req.body.context : null;
  if (!message) return res.status(400).json({ error: 'message is required' });

  try {
    res.json(await chat({ message, history, vaultAddress, walletAddress, context }));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
