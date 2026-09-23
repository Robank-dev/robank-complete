import { createHmac, randomBytes } from 'node:crypto';

const DEFAULT_BASE_URL = 'https://api.buvei.com/open-api/v1';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function signRequest({ method, path, timestamp, nonce, body, secret }) {
  let payload = `${timestamp}.${method.toUpperCase()}.${path}.${nonce}`;

  if (
    body &&
    ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())
  ) {
    payload += `.${body}`;
  }

  return createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('base64');
}

export async function buveiRequest(
  method,
  path,
  body = null,
  { idempotencyKey = null } = {}
) {
  const apiKey = requiredEnv('BUVEI_API_KEY');
  const apiSecret = requiredEnv('BUVEI_API_SECRET');

  const baseUrl = (
    process.env.BUVEI_API_BASE_URL ||
    DEFAULT_BASE_URL
  ).replace(/\/+$/, '');

  const normalizedMethod = method.toUpperCase();
  const timestamp = String(Date.now());
  const nonce = randomBytes(16).toString('hex');

  const bodyString =
    body &&
    ['POST', 'PUT', 'PATCH'].includes(normalizedMethod)
      ? JSON.stringify(body)
      : null;

  const signature = signRequest({
    method: normalizedMethod,
    path,
    timestamp,
    nonce,
    body: bodyString,
    secret: apiSecret
  });

  const headers = {
    'X-API-Key': apiKey,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Signature': signature,
    'Content-Type': 'application/json'
  };

  if (idempotencyKey) {
    headers['X-Idempotency-Key'] = idempotencyKey;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: normalizedMethod,
    headers,
    ...(bodyString ? { body: bodyString } : {})
  });

  const requestId = response.headers.get('X-Request-ID');
  const text = await response.text();

  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Buvei request failed: ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.requestId = requestId;
    error.data = data;
    throw error;
  }

  return {
    status: response.status,
    requestId,
    data
  };
}

export function listCardBins() {
  return buveiRequest('GET', '/card-bins');
}

export function getWalletBalance() {
  return buveiRequest('GET', '/wallet/balance');
}

export function createHostedKycCardholder() {
  return buveiRequest('POST', '/kyc/cardholders/auto', {});
}

export function issueCard(payload, idempotencyKey) {
  return buveiRequest('POST', '/cards', payload, { idempotencyKey });
}

export function getCard(cardId) {
  return buveiRequest(
    'GET',
    `/cards/${encodeURIComponent(cardId)}`
  );
}

export function fundCard(cardId, amountCents, idempotencyKey) {
  return buveiRequest(
    'POST',
    `/cards/${encodeURIComponent(cardId)}/funding`,
    { amount: amountCents },
    { idempotencyKey }
  );
}

export function withdrawCard(cardId, amountCents, idempotencyKey) {
  return buveiRequest(
    'POST',
    `/cards/${encodeURIComponent(cardId)}/withdrawal`,
    { amount: amountCents },
    { idempotencyKey }
  );
}

export function getOperation(idempotencyKey) {
  return buveiRequest(
    'GET',
    `/operations/${encodeURIComponent(idempotencyKey)}`
  );
}