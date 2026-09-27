import { serverRpcs } from '@/lib/server/rpc';

export const dynamic = 'force-dynamic';

// Same-origin JSON-RPC relay for the browser: users on networks that block the public Robinhood
// Chain endpoint still work, and the Alchemy key never reaches the client. Read and broadcast
// methods only — this relay can never sign anything.
const METHODS = new Set([
  'eth_chainId', 'net_version', 'eth_blockNumber', 'eth_call', 'eth_estimateGas', 'eth_gasPrice',
  'eth_maxPriorityFeePerGas', 'eth_feeHistory', 'eth_getBalance', 'eth_getCode', 'eth_getTransactionCount',
  'eth_getTransactionByHash', 'eth_getTransactionReceipt', 'eth_getBlockByNumber', 'eth_sendRawTransaction'
]);
const ORIGINS = /^https:\/\/(robank\.co|[a-z0-9-]+\.privy\.io)$|^http:\/\/localhost(:\d+)?$/;

const hits = new Map<string, { start: number; count: number }>();
function limited(ip: string) {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > 60_000) { hits.set(ip, { start: now, count: 1 }); if (hits.size > 5000) hits.clear(); return false; }
  return ++entry.count > 240;
}

function cors(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') || '';
  return ORIGINS.test(origin) ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type', Vary: 'Origin' } : {};
}

const reply = (request: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors(request) } });
const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });

export async function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request) });
}

export async function POST(request: Request) {
  if (limited(request.headers.get('cf-connecting-ip') || 'local')) return reply(request, rpcError(null, 429, 'Too many requests'), 429);
  const raw = await request.text();
  if (raw.length > 64_000) return reply(request, rpcError(null, -32600, 'Request too large'), 413);
  let body: any;
  try { body = JSON.parse(raw); } catch { return reply(request, rpcError(null, -32700, 'Parse error'), 400); }
  const calls = Array.isArray(body) ? body : [body];
  if (!calls.length || calls.length > 20) return reply(request, rpcError(null, -32600, 'Invalid batch'), 400);
  const blocked = calls.find((c) => !c || typeof c.method !== 'string' || !METHODS.has(c.method));
  if (blocked) return reply(request, rpcError(blocked?.id, -32601, 'Method not allowed'), 400);

  for (const url of serverRpcs()) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      const response = await fetch(url, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: raw }).finally(() => clearTimeout(timer));
      if (response.status === 429 || response.status >= 500) continue;
      return reply(request, await response.json());
    } catch {}
  }
  return reply(request, Array.isArray(body) ? calls.map((c) => rpcError(c.id, -32603, 'Network unavailable')) : rpcError(body.id, -32603, 'Network unavailable'), 502);
}
