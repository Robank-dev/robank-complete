import { randomUUID } from 'node:crypto';
import {
  fundCard,
  getOperation
} from '../integrations/buvei/client.js';
import {
  beginTransaction,
  markSubmitted,
  markProcessing,
  confirmTransaction,
  failTransaction
} from './reconciliation.js';

function toCents(amount) {
  const value = String(amount).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    throw new Error('Amount must be a positive USD value with up to 2 decimals');
  }

  const cents = Math.round(Number(value) * 100);

  if (!Number.isSafeInteger(cents) || cents <= 0) {
    throw new Error('Invalid funding amount');
  }

  return cents;
}

export async function fundCardFromCapital({
  walletAddress,
  cardId,
  amount,
  idempotencyKey = randomUUID()
}) {
  if (!walletAddress) throw new Error('walletAddress is required');
  if (!cardId) throw new Error('cardId is required');

  const amountCents = toCents(amount);

  const ledger = await beginTransaction({
    walletAddress,
    kind: 'card_funding',
    asset: 'USDC',
    amountDelta: `-${Number(amount).toFixed(2)}`,
    network: 'buvei',
    provider: 'buvei',
    idempotencyKey,
    metadata: {
      cardId,
      amountCents,
      source: 'robank-capital'
    }
  });

  try {
    const result = await fundCard(cardId, amountCents, idempotencyKey);
    const operationId = result?.data?.operationId || null;
    const success = result?.data?.success === true;

    if (operationId) {
      await markSubmitted(ledger.id, {
        externalId: operationId,
        metadata: {
          cardId,
          amountCents,
          operationId,
          source: 'robank-capital'
        }
      });
    }

    const operation = await getOperation(idempotencyKey);
    const status = String(operation?.data?.status || '').toUpperCase();

    if (status === 'COMPLETED' || (success && !status)) {
      return confirmTransaction(ledger.id, {
        externalId: operationId,
        metadata: {
          cardId,
          amountCents,
          operationId,
          buveiStatus: status || 'SUCCESS',
          source: 'robank-capital'
        }
      });
    }

    if (status === 'FAILED') {
      return failTransaction(ledger.id, {
        cardId,
        amountCents,
        operationId,
        buveiStatus: status,
        source: 'robank-capital'
      });
    }

    if (status === 'PROCESSING') {
      return markProcessing(ledger.id, {
        cardId,
        amountCents,
        operationId,
        buveiStatus: status,
        source: 'robank-capital'
      });
    }

    return markProcessing(ledger.id, {
      cardId,
      amountCents,
      operationId,
      buveiStatus: status || 'UNKNOWN',
      source: 'robank-capital'
    });
  } catch (error) {
    const status = Number(error?.status || 0);

    if (status >= 400 && status < 500) {
      return failTransaction(ledger.id, {
        cardId,
        amountCents,
        providerError: error.message,
        providerStatus: status,
        source: 'robank-capital'
      });
    }

    return markProcessing(ledger.id, {
      cardId,
      amountCents,
      reconciliationRequired: true,
      providerError: error.message,
      source: 'robank-capital'
    });
  }
}