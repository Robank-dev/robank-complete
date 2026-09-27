import { normalizeDiditStatus } from '@/lib/server/didit';
import { env } from '@/lib/server/env';
import { now, requireDb } from '@/lib/server/records';

export const dynamic = 'force-dynamic';

/** Didit's V2 canonical form: keys sorted recursively, compact separators, Unicode unescaped. */
function canonical(value: unknown): string {
  const sort = (v: unknown): unknown => Array.isArray(v) ? v.map(sort)
    : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sort((v as Record<string, unknown>)[k])])) : v;
  return JSON.stringify(sort(value));
}

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
  return [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Didit verification webhook. Verifies X-Signature-V2 (falling back to the raw-body X-Signature),
 * rejects stale timestamps, then updates the matching KYC or KYB record from vendor_data.
 */
export async function POST(request: Request) {
  const secret = env('DIDIT_WEBHOOK_SECRET');
  if (!secret) return new Response('Webhook not configured', { status: 503 });
  const raw = await request.text();
  if (raw.length > 512_000) return new Response('Payload too large', { status: 413 });
  const timestamp = Number(request.headers.get('x-timestamp'));
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return new Response('Stale or missing timestamp', { status: 401 });

  let body: any;
  try { body = JSON.parse(raw); } catch { return new Response('Invalid JSON', { status: 400 }); }
  const v2 = (request.headers.get('x-signature-v2') || '').toLowerCase();
  const v1 = (request.headers.get('x-signature') || '').toLowerCase();
  const valid = (v2 && safeEqual(v2, await hmacHex(secret, canonical(body)))) || (v1 && safeEqual(v1, await hmacHex(secret, raw)));
  if (!valid) return new Response('Invalid signature', { status: 401 });

  const vendor = String(body?.vendor_data || '');
  const sessionId = String(body?.session_id || '');
  const status = normalizeDiditStatus(body?.status);
  const at = now();
  const database = requireDb();

  if (vendor.startsWith('robank-user-') && status !== 'not_started') {
    // Only the session ROBANK created for this user can change its status.
    await database.prepare('UPDATE kyc SET status = ?2, updated_at = ?3 WHERE user_id = ?1 AND session_id = ?4')
      .bind(vendor.slice('robank-user-'.length), status, at, sessionId).run();
  } else if (vendor.startsWith('robank-company-') && status !== 'not_started') {
    const companyStatus = status === 'approved' ? 'verified' : status === 'declined' ? 'declined' : 'verification_pending';
    await database.prepare('UPDATE companies SET verification_status = ?2, status = ?3, verified_at = ?4, updated_at = ?5 WHERE id = ?1 AND verification_session_id = ?6')
      .bind(vendor.slice('robank-company-'.length), status, companyStatus, status === 'approved' ? at : null, at, sessionId).run();
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
