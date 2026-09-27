import { env } from '@/lib/server/env';
import { now, requireDb } from '@/lib/server/records';

export const dynamic = 'force-dynamic';

const PATH = '/api/buvei/webhook';

async function hmacBase64(secret: string, message: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)))));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Buvei webhooks, signed like outbound calls: base64(HMAC-SHA256(timestamp.POST.path.nonce.rawBody, api_secret)).
 * Updates PayPal cash-outs and card KYC status. Register https://robank.co/api/buvei/webhook with Buvei.
 */
export async function POST(request: Request) {
  // Buvei signs webhooks with the API secret; a dedicated webhook secret is accepted too if one is issued.
  const secrets = [env('BUVEI_WEBHOOK_SECRET'), env('BUVEI_API_SECRET')].filter(Boolean);
  if (!secrets.length) return new Response('Webhook not configured', { status: 503 });
  const raw = await request.text();
  if (raw.length > 256_000) return new Response('Payload too large', { status: 413 });
  const timestamp = request.headers.get('x-timestamp') || '';
  const nonce = request.headers.get('x-nonce') || '';
  const signature = request.headers.get('x-signature') || '';
  if (!timestamp || !nonce || Math.abs(Date.now() - Number(timestamp)) > 10 * 60_000) return new Response('Stale or missing timestamp', { status: 401 });
  const signed = `${timestamp}.POST.${PATH}.${nonce}.${raw}`;
  let valid = false;
  for (const secret of secrets) if (safeEqual(await hmacBase64(secret, signed), signature)) valid = true;
  if (!valid) return new Response('Invalid signature', { status: 401 });

  let event: any;
  try { event = JSON.parse(raw); } catch { return new Response('Invalid JSON', { status: 400 }); }
  const data = event?.data || {};
  const database = requireDb();
  const at = now();
  if (/^PAYOUT_/.test(String(event?.eventType)) && data.merOrderNo && data.status) {
    await database.prepare('UPDATE cashouts SET status = ?2, updated_at = ?3 WHERE mer_order_no = ?1').bind(String(data.merOrderNo), String(data.status), at).run();
  } else if (event?.eventType === 'CARDHOLDER_KYC_STATUS' && data.id && data.kycStatus) {
    await database.prepare('UPDATE cards SET kyc_status = ?2, updated_at = ?3 WHERE cardholder_id = ?1').bind(String(data.id), String(data.kycStatus), at).run();
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
