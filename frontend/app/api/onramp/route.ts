import { chainById } from '@/lib/chains';
import { requireSession } from '@/lib/server/auth';
import { env } from '@/lib/server/env';
import { HttpError, handle, ok, readJson } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

// MoonPay currency codes for USDC on the networks ROBANK wallets use.
const CURRENCY: Record<number, string> = { 1: 'usdc', 8453: 'usdc_base', 42161: 'usdc_arbitrum', 10: 'usdc_optimism', 137: 'usdc_polygon', 1151111081099710: 'usdc_sol' };

async function sign(query: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(query));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export const POST = handle(async (request: Request) => {
  const session = await requireSession(request);
  await rateLimit(`onramp:${session.userId}`, 20, 3600);
  const apiKey = env('MOONPAY_API_KEY');
  const secret = env('MOONPAY_SECRET_KEY');
  if (!apiKey || !secret) throw new HttpError(503, 'Buying with card or bank is not available yet. ROBANK has not enabled MoonPay.');
  const body = await readJson(request);
  const chainId = Number(body.chainId);
  const chain = chainById(chainId);
  const currencyCode = CURRENCY[chainId];
  if (!chain || !currencyCode || String(body.asset || 'USDC').toUpperCase() !== 'USDC') throw new HttpError(400, 'Choose a supported network for USDC.');
  // The destination is always the signed-in user's own wallet; the client cannot redirect funds elsewhere.
  const walletAddress = chain.type === 'solana' ? session.solanaAddress : session.evmAddress;
  if (!walletAddress) throw new HttpError(409, 'Your wallet is still being prepared. Try again in a moment.');
  const url = new URL('https://buy.moonpay.com/');
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('currencyCode', currencyCode);
  url.searchParams.set('walletAddress', walletAddress);
  url.searchParams.set('lockAmount', 'false');
  url.searchParams.set('redirectURL', 'https://robank.co/dashboard');
  const amount = Number(body.amount);
  if (body.amount != null && body.amount !== '') {
    if (!Number.isFinite(amount) || amount < 20 || amount > 20000) throw new HttpError(400, 'Enter an amount between $20 and $20,000.');
    url.searchParams.set('baseCurrencyCode', 'usd');
    url.searchParams.set('baseCurrencyAmount', amount.toFixed(2));
  }
  url.searchParams.set('signature', await sign(url.search, secret));
  return ok({ url: url.toString() });
});
