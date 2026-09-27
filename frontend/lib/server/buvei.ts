import { env } from './env';
import { HttpError } from './http';

const PREFIX = '/open-api/v1';

export function buveiConfigured() {
  return Boolean(env('BUVEI_API_KEY') && env('BUVEI_API_SECRET') && env('BUVEI_TREASURY_WALLET'));
}

async function hmac(secret: string, payload: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)))));
}

/** Signed Buvei OpenAPI call (HMAC-SHA256 over timestamp.method.path.nonce[.body]). Returns `data` of the envelope. */
export async function buvei<T = any>(method: 'GET' | 'POST', path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
  const apiKey = env('BUVEI_API_KEY');
  const secret = env('BUVEI_API_SECRET');
  if (!apiKey || !secret) throw new HttpError(503, 'The card service is being activated. Please try again soon.');
  const base = (env('BUVEI_API_BASE_URL') || 'https://api.buvei.com').replace(/\/+$/, '').replace(/\/open-api\/v1$/, '');
  const fullPath = PREFIX + path;
  const timestamp = String(Date.now());
  const nonce = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
  const raw = body === undefined ? '' : JSON.stringify(body);
  const signature = await hmac(secret, `${timestamp}.${method}.${fullPath}.${nonce}${method === 'POST' && raw ? `.${raw}` : ''}`);
  const headers: Record<string, string> = { 'X-API-Key': apiKey, 'X-Timestamp': timestamp, 'X-Nonce': nonce, 'X-Signature': signature, Accept: 'application/json' };
  if (raw) headers['Content-Type'] = 'application/json';
  if (idempotencyKey) headers['X-Idempotency-Key'] = idempotencyKey;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  let response: Response;
  try {
    response = await fetch(base + fullPath, { method, headers, body: raw || undefined, signal: controller.signal });
  } catch {
    throw new HttpError(502, 'The card service did not respond. Nothing was charged.');
  } finally {
    clearTimeout(timer);
  }
  const envelope = await response.json().catch(() => null) as any;
  if (!response.ok || envelope?.code !== 0) {
    console.error('[robank] buvei error', response.status, envelope?.code, envelope?.message, response.headers.get('X-Request-ID'));
    const fields = envelope?.errors && typeof envelope.errors === 'object' ? Object.values(envelope.errors).join(' ') : '';
    // The project wallet at Buvei pays for verifications, payouts and card loads; users must not see it as their own balance.
    if (/insufficient|balance/i.test(String(envelope?.message || ''))) throw new HttpError(503, 'This service is temporarily unavailable. Please try again later.');
    if (response.status === 403) throw new HttpError(503, 'The card service is not reachable from ROBANK right now. Please try again soon.');
    throw new HttpError(response.status === 409 ? 409 : 502, fields || (typeof envelope?.message === 'string' ? `Card service: ${envelope.message}` : 'The card service rejected the request.'));
  }
  return envelope.data as T;
}

export type CardBin = { cardBinId: string; bin: string; brand: string; issuingCountry: string; currency: string; mobile: boolean; email: boolean; requireKycCardholder: boolean };

let binCache: { at: number; bins: CardBin[] } | null = null;
export async function cardBins() {
  if (binCache && Date.now() - binCache.at < 6 * 3600_000) return binCache.bins;
  const bins = await buvei<CardBin[]>('GET', '/card-bins');
  binCache = { at: Date.now(), bins: Array.isArray(bins) ? bins : [] };
  return binCache.bins;
}

/** Preferred BIN: optional BUVEI_CARD_BIN_ID, else a non-US VISA (no billing address needed), else any. */
export async function pickBin() {
  const bins = await cardBins();
  const preferred = env('BUVEI_CARD_BIN_ID');
  const usable = bins.filter((b) => !b.mobile);
  return bins.find((b) => b.cardBinId === preferred) || usable.find((b) => b.brand === 'VISA' && b.issuingCountry !== 'US') || usable.find((b) => b.issuingCountry !== 'US') || bins.find((b) => b.issuingCountry !== 'US') || bins[0] || null;
}
