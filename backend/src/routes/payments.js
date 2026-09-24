import { Router } from 'express';
import { isAddress } from 'viem';
import { randomUUID } from 'node:crypto';
import { buildUsdcTransfer, buildTokenTransfer } from '../services/payment.js';
import { beginTransaction, markSubmitted, confirmTransaction, failTransaction } from '../services/reconciliation.js';
import { getLedgerTransactionByIdempotencyKey } from '../services/database.js';
import { verifyMainnetTransaction } from '../services/transactionVerification.js';
import { requirePrivyWallet } from '../middleware/privyAuth.js';
import { BASE_MAINNET_CHAIN_ID, ROBINHOOD_CHAIN_ID } from '../constants.js';

const router = Router();

router.post('/route', async (req, res) => {
  const from = String(req.body?.from || '').trim();
  const ownedFrom = await requirePrivyWallet(req, res, from);
  if (!ownedFrom) return;
  const to = String(req.body?.to || '').trim();
  const amount = String(req.body?.amount || '').trim();
  const network = String(req.body?.network || 'base').toLowerCase();
  const token = String(req.body?.token || (network === 'robinhood' ? 'USDG' : 'USDC')).toUpperCase();

  if (!['base', 'robinhood'].includes(network)) {
    return res.status(400).json({ error: 'Unsupported network.' });
  }
  if ((network === 'base' && token !== 'USDC') || (network === 'robinhood' && token !== 'USDG')) {
    return res.status(400).json({ error: 'Only USDC is enabled in this MVP.' });
  }

  if (!isAddress(to)) {
    return res.status(400).json({ error: 'Invalid recipient address.' });
  }

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  try {
    res.json({
      route: {
        network,
        asset: token,
        provider: 'onchain',
        recipient: to,
        amount
      },
      transaction: buildTokenTransfer({ network, token, to, amount })
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/intent', async (req, res) => {
  const walletAddress = String(req.body?.walletAddress || '').trim();
  const to = String(req.body?.to || '').trim();
  const amount = String(req.body?.amount || '').trim();
  const network = String(req.body?.network || 'base').toLowerCase();
  const token = String(req.body?.token || (network === 'robinhood' ? 'USDG' : 'USDC')).toUpperCase();
  const idempotencyKey =
    String(req.headers['x-idempotency-key'] || '').trim() || randomUUID();

  const ownedWallet = await requirePrivyWallet(req, res, walletAddress);
  if (!ownedWallet) return;

  if (!isAddress(to)) {
    return res.status(400).json({ error: 'Invalid recipient address.' });
  }

  if (!['base', 'robinhood'].includes(network)) {
    return res.status(400).json({ error: 'Unsupported network.' });
  }
  if ((network === 'base' && token !== 'USDC') || (network === 'robinhood' && token !== 'USDG')) {
    return res.status(400).json({ error: `Unsupported token ${token} on ${network}.` });
  }

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }

  try {
    const transaction = await beginTransaction({
      walletAddress: ownedWallet,
      kind: 'payment',
      asset: token,
      amountDelta: `-${amount}`,
      network,
      provider: 'onchain',
      idempotencyKey,
      metadata: {
        recipient: to,
        direction: 'outgoing',
        execution: 'pending'
      }
    });

    res.status(201).json({
      intent: {
        id: transaction.id,
        status: transaction.status,
        walletAddress,
        recipient: to,
        amount,
        token,
        network,
        idempotencyKey
      },
      transaction: buildTokenTransfer({ network, token, to, amount })
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/confirm', async (req, res) => {
  const walletAddress = String(req.body?.walletAddress || '').trim();
  const destination = String(req.body?.destination || '').trim();
  const amount = String(req.body?.amount || '').trim();
  const network = String(req.body?.network || 'base').toLowerCase();
  const asset = String(req.body?.asset || (network === 'robinhood' ? 'USDG' : 'USDC')).toUpperCase();
  const txHash = String(req.body?.txHash || '').trim();

  const ownedWallet = await requirePrivyWallet(req, res, walletAddress);
  if (!ownedWallet) return;
  if (!isAddress(destination)) {
    return res.status(400).json({ error: 'Valid destination is required.' });
  }
  if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount.' });
  }
  if (!['base', 'robinhood'].includes(network)) {
    return res.status(400).json({ error: 'Unsupported network.' });
  }
  if ((network === 'base' && asset !== 'USDC') || (network === 'robinhood' && asset !== 'USDG')) {
    return res.status(400).json({ error: `Unsupported asset ${asset} on ${network}.` });
  }
  if (!txHash) {
    return res.status(400).json({ error: 'txHash is required.' });
  }

  const idempotencyKey = `payment-tx:${txHash.toLowerCase()}`;

  try {
    const existing = await getLedgerTransactionByIdempotencyKey(idempotencyKey);
    if (existing?.status === 'confirmed') {
      return res.json({ stage: 'completed', ledger: existing, verified: true, idempotent: true });
    }
    if (existing?.status === 'failed') {
      return res.status(409).json({ stage: 'failed', ledger: existing, verified: false, idempotent: true });
    }

    const ledger = existing || await beginTransaction({
      walletAddress: ownedWallet,
      kind: 'payment',
      asset,
      amountDelta: `-${amount}`,
      network,
      provider: 'onchain',
      idempotencyKey,
      metadata: { destination, direction: 'outgoing', execution: 'wallet-signed' }
    });

    const submitted = await markSubmitted(ledger.id, {
      externalId: txHash,
      metadata: { destination, direction: 'outgoing', execution: 'wallet-signed', txHash }
    });

    let verification;
    try {
      verification = await verifyMainnetTransaction(txHash, {
        walletAddress: ownedWallet,
        destination,
        amount,
        network,
        asset
      });
    } catch (error) {
      return res.status(202).json({
        stage: 'submitted',
        ledger: submitted,
        verified: false,
        requiresReconciliation: true,
        verificationError: error.message
      });
    }

    if (!verification.verified) {
      const failed = await failTransaction(submitted.id, {
        stage: 'verification-failed',
        verification
      });
      return res.status(400).json({ stage: 'failed', ledger: failed, verified: false, verification });
    }

    const confirmed = await confirmTransaction(submitted.id, {
      externalId: txHash,
      metadata: { destination, direction: 'outgoing', execution: 'wallet-signed', stage: 'verified', verification }
    });

    return res.json({ stage: 'completed', ledger: confirmed, verified: true, verification });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;