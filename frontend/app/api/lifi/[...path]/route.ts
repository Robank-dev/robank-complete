import { NextResponse } from 'next/server';

const LIFI = 'https://li.quest/v1';
const SUPPORTED_CHAINS = [1, 8453, 42161, 10, 137, 56, 4663, 1151111081099710];
const RHC_USDG = '0x5fc5360d0400a0fd4f2af552add042d716f1d168';

let stableCache: { expiresAt: number; tokens: any[] } = { expiresAt: 0, tokens: [] };

function headers() {
  const key = process.env.LIFI_API_KEY?.trim();
  return {
    Accept: 'application/json',
    'User-Agent': 'ROBANK/1.0',
    ...(key ? { 'x-lifi-api-key': key } : {})
  };
}

async function lifi(path: string, init?: RequestInit) {
  const response = await fetch(LIFI + path, {
    ...init,
    headers: { ...headers(), ...(init?.headers || {}) }
  });
  const text = await response.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { message: text }; }
  if (!response.ok) {
    throw new Error(body?.message || body?.error || 'LI.FI request failed: ' + response.status);
  }
  return body;
}

async function stableTokens() {
  if (stableCache.expiresAt > Date.now()) return stableCache.tokens;
  const body = await lifi('/tokens?chains=' + SUPPORTED_CHAINS.join(',') + '&tags=stablecoin');
  const tokens: any[] = [];
  const seen = new Set<string>();
  for (const list of Object.values(body?.tokens || {})) {
    for (const token of (list as any[]) || []) {
      const symbol = String(token?.symbol || '').toUpperCase();
      const verified = token?.verificationStatus === 'verified';
      const isRhcUsdg = Number(token?.chainId) === 4663 && symbol === 'USDG' &&
        String(token?.address || '').toLowerCase() === RHC_USDG;
      if (!((symbol === 'USDC' || symbol === 'USDT') && verified) && !isRhcUsdg) continue;
      const key = Number(token.chainId) + ':' + String(token.address).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      tokens.push(token);
    }
  }
  stableCache = { expiresAt: Date.now() + 300000, tokens };
  return tokens;
}

function findToken(tokens: any[], chainId: unknown, address: unknown) {
  return tokens.find((token) =>
    Number(token?.chainId) === Number(chainId) &&
    String(token?.address || '').toLowerCase() === String(address || '').toLowerCase()
  ) || null;
}

async function getStableToken(chainId: unknown, address: unknown) {
  return findToken(await stableTokens(), chainId, address);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const parts = (await params).path || [];
  const resource = parts.join('/');
  try {
    if (resource === 'chains') {
      const body = await lifi('/chains');
      const chains = (body?.chains || []).filter((chain: any) => SUPPORTED_CHAINS.includes(Number(chain.id)));
      return NextResponse.json({ chains }, { headers: { 'Cache-Control': 'public, max-age=300' } });
    }

    if (resource === 'tokens') {
      const tokens = await stableTokens();
      return NextResponse.json({ tokens }, { headers: { 'Cache-Control': 'public, max-age=300' } });
    }

    return NextResponse.json({ error: 'Unsupported LI.FI resource.' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'LI.FI unavailable.' }, { status: 502 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const parts = (await params).path || [];
  if (parts.join('/') !== 'quote') {
    return NextResponse.json({ error: 'Unsupported LI.FI resource.' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const fromChain = Number(body?.fromChain);
    const toChain = Number(body?.toChain);
    const fromAddress = String(body?.fromAddress || '').trim();
    const toAddress = String(body?.toAddress || '').trim();
    const amount = String(body?.amount || '').trim();
    const mode = body?.mode === 'toAmount' ? 'toAmount' : 'fromAmount';
    if (!SUPPORTED_CHAINS.includes(fromChain) || !SUPPORTED_CHAINS.includes(toChain)) {
      return NextResponse.json({ error: 'Unsupported source or destination network.' }, { status: 400 });
    }
    if (!fromAddress || !toAddress || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Missing or invalid quote parameters.' }, { status: 400 });
    }

    const source = await getStableToken(fromChain, body?.fromToken);
    const destination = await getStableToken(toChain, body?.toToken);

    if (!source || !destination) {
      return NextResponse.json({ error: 'Unsupported asset/network combination.' }, { status: 400 });
    }

    const params = new URLSearchParams({
      fromChain: String(fromChain),
      toChain: String(toChain),
      fromToken: String(source.address),
      toToken: String(destination.address),
      fromAddress,
      toAddress,
      [mode]: amount,
      slippage: '0.005',
      order: 'CHEAPEST',
      integrator: 'robank'
    });

    const feeBps = Number(process.env.ROBANK_LIFI_FEE_BPS || 0);
    if (Number.isFinite(feeBps) && feeBps > 0) params.set('fee', String(feeBps / 10000));

    const quote = await lifi('/' + (mode === 'toAmount' ? 'quote/toAmount' : 'quote') + '?' + params.toString());
    return NextResponse.json({ quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to build LI.FI quote.';
    const status = /rate limit|too many requests/i.test(message) ? 429 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
