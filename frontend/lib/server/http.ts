import { NextResponse } from 'next/server';

export class HttpError extends Error {
  constructor(public status: number, message: string, public headers?: Record<string, string>) {
    super(message);
  }
}

const NO_STORE = { 'Cache-Control': 'private, no-store, max-age=0' };

export function ok(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
  return NextResponse.json(body, { status: init?.status ?? 200, headers: { ...NO_STORE, ...(init?.headers || {}) } });
}

export function fail(status: number, error: string, headers?: Record<string, string>) {
  return NextResponse.json({ error }, { status, headers: { ...NO_STORE, ...(headers || {}) } });
}

/** Wraps a route so thrown HttpErrors become clean JSON and nothing internal leaks. */
export function handle<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof HttpError) return fail(error.status, error.message, error.headers);
      console.error('[robank] unhandled route error', error instanceof Error ? error.message : error);
      return fail(500, 'Something went wrong on our side. Please try again.');
    }
  };
}

export async function readJson<T = Record<string, unknown>>(request: Request, maxBytes = 32_000): Promise<T> {
  const type = request.headers.get('content-type') || '';
  if (!type.includes('application/json')) throw new HttpError(415, 'Expected a JSON request body.');
  const raw = await request.text();
  if (raw.length > maxBytes) throw new HttpError(413, 'Request body is too large.');
  try {
    const parsed = JSON.parse(raw || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
    return parsed as T;
  } catch {
    throw new HttpError(400, 'Invalid JSON body.');
  }
}

export function text(value: unknown, { max, required, name }: { max: number; required?: boolean; name: string }) {
  const out = typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim();
  if (required && !out) throw new HttpError(400, `${name} is required.`);
  if (out.length > max) throw new HttpError(400, `${name} must be ${max} characters or fewer.`);
  return out;
}

export function httpsUrl(value: unknown, name: string) {
  const raw = text(value, { max: 500, name });
  if (!raw) return '';
  let url: URL;
  try { url = new URL(raw); } catch { throw new HttpError(400, `${name} must be a valid URL.`); }
  if (url.protocol !== 'https:') throw new HttpError(400, `${name} must use https.`);
  return url.toString();
}

export function clientIp(request: Request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/** fetch with a hard timeout; provider failures surface as HttpError 502/504 with a safe message. */
export async function fetchJson<T = any>(url: string, init: RequestInit & { timeoutMs?: number; provider?: string } = {}): Promise<T> {
  const { timeoutMs = 8000, provider = 'Provider', ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'ROBANK/1.0', ...(rest.headers || {}) }
    });
    const body = await response.text();
    let data: any = null;
    try { data = body ? JSON.parse(body) : null; } catch { data = null; }
    if (response.status === 429) throw new HttpError(429, `${provider} is rate limiting requests. Try again shortly.`, { 'Retry-After': '30' });
    if (!response.ok) throw new HttpError(502, `${provider} returned an error (${response.status}).`);
    if (data === null) throw new HttpError(502, `${provider} returned an unreadable response.`);
    return data as T;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if ((error as Error)?.name === 'AbortError') throw new HttpError(504, `${provider} did not respond in time.`);
    throw new HttpError(502, `${provider} is unreachable right now.`);
  } finally {
    clearTimeout(timer);
  }
}
