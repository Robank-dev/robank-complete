import { evaluateAction } from './agentPolicy.js';
import { getLedgerTransactionByIdempotencyKey } from './database.js';
import { verifyBaseMainnetTransaction } from './transactionVerification.js';
import {
  beginTransaction,
  markSubmitted,
  confirmTransaction,
  failTransaction
} from './reconciliation.js';

export async function prepareAgentAction({
  walletAddress,
  actionType,
  amountUsd = 0,
  asset = 'USDC',
  network = 'base',
  provider = null,
  currentLtv = 0,
  metadata = {}
}) {
  if (!walletAddress) throw new Error('walletAddress is required');
  if (!actionType) throw new Error('actionType is required');

  const policy = evaluateAction({
    walletAddress,
    amountUsd,
    asset,
    network,
    provider,
    currentLtv,
    actionType
  });

  return {
    stage: 'prepared',
    action: {
      type: actionType,
      walletAddress,
      amountUsd: Number(amountUsd),
      asset,
      network,
      provider,
      metadata
    },
    policy: {
      allowed: policy.allowed,
      requiresApproval: policy.requiresApproval,
      reasons: policy.reasons
    },
    execution: {
      ready: policy.allowed && !policy.requiresApproval,
      requiresApproval: policy.requiresApproval
    }
  };
}

export async function executeAgentAction({
  walletAddress,
  actionType,
  amountUsd = 0,
  asset = 'USDC',
  network = 'base',
  provider = null,
  currentLtv = 0,
  idempotencyKey,
  metadata = {},
  executor
}) {
  if (typeof executor !== 'function') {
    throw new Error('executor is required');
  }

  const prepared = await prepareAgentAction({
    walletAddress,
    actionType,
    amountUsd,
    asset,
    network,
    provider,
    currentLtv,
    metadata
  });

  if (!prepared.execution.ready) {
    return {
      stage: 'blocked',
      prepared
    };
  }

  if (idempotencyKey) {
    const existing = await getLedgerTransactionByIdempotencyKey(idempotencyKey);
    if (existing) {
      return {
        stage: existing.status === 'confirmed' ? 'completed' : 'idempotent-replay',
        prepared,
        ledger: existing,
        idempotent: true,
        verified: existing.status === 'confirmed'
      };
    }
  }

  const ledger = await beginTransaction({
    walletAddress,
    kind: actionType,
    asset,
    amountDelta: `-${Number(amountUsd)}`,
    network,
    provider,
    idempotencyKey,
    metadata: {
      ...metadata,
      agent: true,
      stage: 'execution'
    }
  });

  try {
    const result = await executor(prepared.action);

    await markSubmitted(ledger.id, {
      externalId: result?.externalId || result?.txHash || null,
      metadata: {
        ...metadata,
        agent: true,
        stage: 'submitted',
        executorResult: result || null
      }
    });

    let verified = false;
    let verification = null;

    if (typeof result?.verify === 'function') {
      verified = Boolean(await result.verify());
    } else if (result?.confirmed === true) {
      verified = true;
    } else if (result?.txHash && network === 'base') {
      verification = await verifyBaseMainnetTransaction(result.txHash, { walletAddress, destination: metadata.destination, amount: amountUsd });
      verified = verification.verified;
    }

    if (!verified) {
      return {
        stage: 'submitted',
        prepared,
        ledger,
        providerResult: result,
        verification,
        verified: false,
        requiresReconciliation: true
      };
    }

    const confirmed = await confirmTransaction(ledger.id, {
      externalId: result?.externalId || result?.txHash || null,
      metadata: {
        ...metadata,
        agent: true,
        stage: 'verified',
        providerResult: result || null
      }
    });

    return {
      stage: 'completed',
      prepared,
      ledger: confirmed,
      providerResult: result,
      verification,
      verified: true
    };
  } catch (error) {
    const failed = await failTransaction(ledger.id, {
      ...metadata,
      agent: true,
      stage: 'failed',
      error: error.message
    });

    return {
      stage: 'failed',
      prepared,
      ledger: failed,
      error: error.message,
      verified: false
    };
  }
}

export async function runAgentDecision({
  walletAddress,
  decision,
  executor
}) {
  if (!decision || typeof decision !== 'object') {
    throw new Error('decision is required');
  }

  const actionType = String(decision.type || 'none');

  if (actionType === 'none' || actionType === 'info') {
    return {
      stage: 'no-execution',
      action: actionType,
      response: 'No financial execution requested.'
    };
  }

  return executeAgentAction({
    walletAddress,
    actionType,
    amountUsd: decision.amountUsd || 0,
    asset: decision.asset || 'USDC',
    network: decision.network || 'base',
    provider: decision.provider || null,
    currentLtv: decision.currentLtv || 0,
    idempotencyKey: decision.idempotencyKey,
    metadata: decision.metadata || {},
    executor
  });
}