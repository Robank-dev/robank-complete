import { requireSession } from '@/lib/server/auth';
import { HttpError, handle, ok, readJson } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { marketService } from '@/lib/server/market';
import { ROBINHOOD_CHAIN_ID, USDG } from '@/lib/chains';

export const dynamic = 'force-dynamic';

const NETWORK = `eip155:${ROBINHOOD_CHAIN_ID}`;
const MAX_PRICE_UNITS = BigInt(5_000_000); // never pay more than 5 USDG per call
const MAX_BYTES = 1_500_000;

const b64decode = (value: string) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(value), (c) => c.charCodeAt(0))));

/** Reads the x402 payment requirements from a 402 response (v2 header, or v1 JSON body). */
async function requirementsFrom(response: Response) {
  const header = response.headers.get('payment-required');
  let doc: any = null;
  if (header) { try { doc = b64decode(header); } catch { doc = null; } }
  if (!doc) { try { doc = await response.json(); } catch { doc = null; } }
  const accepts: any[] = Array.isArray(doc?.accepts) ? doc.accepts : [];
  const requirement = accepts.find((a) => a?.scheme === 'exact' && (a?.network === NETWORK || a?.network === 'robinhood') && String(a?.asset || '').toLowerCase() === USDG.address.toLowerCase());
  return { version: Number(doc?.x402Version) === 1 ? 1 : 2, resource: doc?.resource ?? null, requirement };
}

async function readResult(response: Response) {
  const type = response.headers.get('content-type') || 'application/octet-stream';
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) return { type, text: `The response is too large to show (${Math.round(buffer.byteLength / 1024)} KB).` };
  if (/^(image|audio)\//.test(type)) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { type, dataUrl: `data:${type.split(';')[0]};base64,${btoa(binary)}` };
  }
  return { type, text: new TextDecoder().decode(buffer).slice(0, 200_000) };
}

/**
 * Calls a catalogued x402 service on behalf of the signed-in user. Step 1 (no payment) returns
 * the live price to sign; step 2 forwards the user's signed USDG authorization. Only services in
 * the Robinhood Chain catalog can be reached, so this is not an open proxy.
 */
export const POST = handle(async (request: Request) => {
  const session = await requireSession(request, { allowApiKey: false });
  await rateLimit(`market:${session.userId}`, 40, 600);
  const body = await readJson<{ id?: unknown; params?: unknown; body?: unknown; payment?: unknown }>(request, 64_000);
  const service = await marketService(String(body.id || '').slice(0, 140));
  if (!service) throw new HttpError(404, 'This service is no longer listed.');

  const url = new URL(service.url);
  const params = body.params && typeof body.params === 'object' ? body.params as Record<string, unknown> : {};
  for (const [key, value] of Object.entries(params).slice(0, 20)) {
    const v = String(value ?? '').slice(0, 500);
    if (/^[A-Za-z0-9_.\-[\]]{1,40}$/.test(key) && v !== '') url.searchParams.set(key, v);
  }
  const payload = service.method === 'POST' ? String(body.body ?? service.body ?? '{}').slice(0, 20_000) : undefined;
  if (payload) { try { JSON.parse(payload); } catch { throw new HttpError(400, 'The request body must be valid JSON.'); } }

  const payment = typeof body.payment === 'string' ? body.payment.slice(0, 8000) : '';
  const headers: Record<string, string> = { Accept: 'application/json, */*', 'User-Agent': 'ROBANK/1.0' };
  if (payload) headers['Content-Type'] = 'application/json';
  if (payment) {
    let version = 2;
    try { version = Number(b64decode(payment)?.x402Version) === 1 ? 1 : 2; } catch { throw new HttpError(400, 'Invalid payment.'); }
    headers[version === 1 ? 'X-PAYMENT' : 'PAYMENT-SIGNATURE'] = payment;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  let response: Response;
  try {
    response = await fetch(url.toString(), { method: service.method, headers, body: payload, signal: controller.signal, redirect: 'manual' });
  } catch (error) {
    throw new HttpError((error as Error)?.name === 'AbortError' ? 504 : 502, `${service.name} did not respond.`);
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 402) {
    const { version, resource, requirement } = await requirementsFrom(response);
    if (payment) throw new HttpError(402, 'The service did not accept the payment. Nothing was charged unless your wallet shows a transfer.');
    if (!requirement) throw new HttpError(422, 'This service no longer accepts USDG on Robinhood Chain.');
    if (BigInt(String(requirement.amount)) > MAX_PRICE_UNITS) throw new HttpError(422, 'This call costs more than 5 USDG, which ROBANK does not allow from the terminal.');
    return ok({ status: 'payment-required', x402Version: version, resource, requirement, priceUsd: Number(requirement.amount) / 10 ** USDG.decimals, service: { id: service.id, name: service.name } });
  }
  const settled = response.headers.get('payment-response') || response.headers.get('x-payment-response');
  const result = await readResult(response);
  return ok({ status: response.ok ? 'ok' : 'error', httpStatus: response.status, paid: Boolean(payment && settled), settlement: settled, result });
});
