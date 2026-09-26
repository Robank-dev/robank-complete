const LIFI_API_URL = 'https://li.quest/v1';
const CACHE_TTL_MS = 5 * 60 * 1000;

export const SUPPORTED_LIFI_CHAINS = [
  1, 8453, 42161, 10, 137, 56, 4663, 1151111081099710
];

let tokenCache = { expiresAt: 0, data: null };
let chainCache = { expiresAt: 0, data: null };

function headers() {
  const key = process.env.LIFI_API_KEY?.trim();
  return {
    Accept: 'application/json',
    'User-Agent': 'ROBANK/1.0',
    ...(key ? { 'x-lifi-api-key': key } : {})
  };
}

async function request(path) {
  const response = await fetch(`${LIFI_API_URL}${path}`, { headers: headers() });
  const text = await response.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = { message: text }; }
  if (!response.ok) throw new Error(body?.message || `LI.FI request failed: ${response.status}`);
  return body;
}

export async function getSupportedChains() {
  if (chainCache.data && chainCache.expiresAt > Date.now()) return chainCache.data;
  const body = await request('/chains');
  const chains = (body?.chains || []).filter((c) => SUPPORTED_LIFI_CHAINS.includes(Number(c.id)));
  chainCache = { data: chains, expiresAt: Date.now() + CACHE_TTL_MS };
  return chains;
}

export async function getSupportedTokens() {
  if (tokenCache.data && tokenCache.expiresAt > Date.now()) return tokenCache.data;
  const chains = SUPPORTED_LIFI_CHAINS.join(',');
  const body = await request(`/tokens?chains=${chains}&tags=stablecoin`);
  const stablecoins = [];
  for (const id of Object.keys(body?.tokens || {})) {
    for (const token of body.tokens[id] || []) {
      const symbol = String(token.symbol || '').toUpperCase();
      const verified = token.verificationStatus === 'verified';
      const isRhcUsdg = Number(token.chainId) === 4663 && symbol === 'USDG'
        && token.address.toLowerCase() === '0x5fc5360d0400a0fd4f2af552add042d716f1d168';
      if ((symbol === 'USDC' || symbol === 'USDT') && verified) stablecoins.push(token);
      if (isRhcUsdg) stablecoins.push(token);
    }
  }
  tokenCache = { data: stablecoins, expiresAt: Date.now() + CACHE_TTL_MS };
  return stablecoins;
}

let swapTokenCache = { expiresAt: 0, data: null };

export async function getSupportedSwapTokens() {
  if (swapTokenCache.data && swapTokenCache.expiresAt > Date.now()) return swapTokenCache.data;
  const body = await request('/tokens?chains=8453,1151111081099710');
  const targets = [];
  const seen = new Set();
  for (const id of Object.keys(body?.tokens || {})) {
    for (const token of body.tokens[id] || []) {
      const chainId = Number(token.chainId);
      const symbol = String(token.symbol || '').toUpperCase();
      const name = String(token.name || '');
      const verified = token.verificationStatus === 'verified';
      const isBaseBacked = chainId === 8453 && verified && /^(?:B|WB)[A-Z0-9]{2,8}$/.test(symbol) && /backed/i.test(name);
      const isSolanaXStock = chainId === 1151111081099710 && verified && /xstock/i.test(name) && /X$/.test(symbol);
      if (!(isBaseBacked || isSolanaXStock)) continue;
      const key = chainId + ':' + String(token.address || '').toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      targets.push(token);
    }
  }
  swapTokenCache = { data: targets, expiresAt: Date.now() + CACHE_TTL_MS };
  return targets;
}

export async function getQuote({
  fromChain, toChain, fromToken, toToken, fromAddress, toAddress,
  amount, mode = 'fromAmount', slippage = 0.005, feeBps = 0
}) {
  const endpoint = mode === 'toAmount' ? '/quote/toAmount' : '/quote';
  const params = new URLSearchParams({
    fromChain: String(fromChain), toChain: String(toChain),
    fromToken, toToken, fromAddress, toAddress,
    [mode]: String(amount), slippage: String(slippage),
    order: 'CHEAPEST', integrator: 'robank'
  });
  if (feeBps > 0) params.set('fee', String(feeBps / 10000));
  return request(`${endpoint}?${params.toString()}`);
}

export function validateSupportedChain(chainId) {
  return SUPPORTED_LIFI_CHAINS.includes(Number(chainId));
}

export async function validateSupportedToken(chainId, address) {
  const tokens = await getSupportedTokens();
  return tokens.find((token) => Number(token.chainId) === Number(chainId)
    && token.address.toLowerCase() === String(address).toLowerCase()) || null;
}
