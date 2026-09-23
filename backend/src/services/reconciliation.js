import {
  createLedgerTransaction,
  getLedgerTransaction,
  updateLedgerTransaction,
  listLedgerTransactions
} from './database.js';

export async function beginTransaction({
  walletAddress,
  kind,
  asset,
  amountDelta,
  network = null,
  provider = null,
  idempotencyKey,
  metadata = {}
}) {
  return createLedgerTransaction({
    walletAddress,
    kind,
    asset,
    amountDelta,
    status: 'pending',
    network,
    provider,
    idempotencyKey,
    metadata
  });
}

export function isFinalStatus(status) {
  return ['confirmed', 'failed', 'reversed', 'recovered'].includes(status);
}

export function canTransition(from, to) {
  const transitions = {
    pending: ['submitted', 'processing', 'failed'],
    submitted: ['processing', 'confirmed', 'failed'],
    processing: ['confirmed', 'failed', 'reversed'],
    confirmed: ['reversed'],
    failed: ['recovered'],
    reversed: ['recovered'],
    recovered: []
  };

  return transitions[from]?.includes(to) ?? false;
}

async function transitionTransaction(id, to, patch = {}) {
  const current = await getLedgerTransaction(id);

  if (current.status === to) {
    return current;
  }

  if (!canTransition(current.status, to)) {
    throw new Error(
      `Invalid ledger transition: ${current.status} -> ${to}`
    );
  }

  return updateLedgerTransaction(id, {
    ...patch,
    status: to
  });
}

export async function markSubmitted(
  id,
  { externalId = null, metadata = {} } = {}
) {
  return transitionTransaction(id, 'submitted', {
    ...(externalId ? { externalId } : {}),
    ...(Object.keys(metadata).length ? { metadata } : {})
  });
}

export async function markProcessing(id, metadata = {}) {
  return transitionTransaction(id, 'processing', {
    ...(Object.keys(metadata).length ? { metadata } : {})
  });
}

export async function confirmTransaction(
  id,
  { externalId = null, metadata = {} } = {}
) {
  return transitionTransaction(id, 'confirmed', {
    ...(externalId ? { externalId } : {}),
    ...(Object.keys(metadata).length ? { metadata } : {})
  });
}

export async function failTransaction(id, metadata = {}) {
  return transitionTransaction(id, 'failed', {
    ...(Object.keys(metadata).length ? { metadata } : {})
  });
}

export async function reverseTransaction(id, metadata = {}) {
  return transitionTransaction(id, 'reversed', {
    ...(Object.keys(metadata).length ? { metadata } : {})
  });
}

export async function recoverTransaction(id, metadata = {}) {
  return transitionTransaction(id, 'recovered', {
    ...(Object.keys(metadata).length ? { metadata } : {})
  });
}

export async function getTransactionState({
  walletAddress = null,
  limit = 100
} = {}) {
  return listLedgerTransactions({ walletAddress, limit });
}
