import { decodeFunctionResult, encodeFunctionData } from 'viem';
import { ROBINHOOD, USDG, formatUnits } from '@/lib/chains';
import { getRobinhoodTokens, type RobinhoodToken } from '@/lib/robinhoodCatalog';
import { HttpError, fetchJson } from './http';
import { serverRpcs } from './rpc';

/**
 * Stock Token swaps on Robinhood Chain through the KyberSwap aggregator (Uniswap v2/v3/v4 and
 * other pools). The server only builds a quote and calldata; the user approves and signs.
 */

const KYBER = 'https://aggregator-api.kyberswap.com/robinhood/api/v1';
const HEADERS = { 'x-client-id': 'robank', Accept: 'application/json', 'Content-Type': 'application/json' };
const SLIPPAGE_BPS = 100; // 1% — shown to the user as the minimum they receive
const DECIMALS_ABI = [{ type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] }] as const;

const decimalsCache = new Map<string, number>();

async function tokenDecimals(contract: string) {
  const key = contract.toLowerCase();
  const hit = decimalsCache.get(key);
  if (hit != null) return hit;
  const body = await fetchJson<any>(serverRpcs()[0], {
    method: 'POST', provider: 'Robinhood Chain', timeoutMs: 7000, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: contract, data: encodeFunctionData({ abi: DECIMALS_ABI, functionName: 'decimals' }) }, 'latest'] })
  });
  const n = Number(decodeFunctionResult({ abi: DECIMALS_ABI, functionName: 'decimals', data: String(body?.result || '0x') as `0x${string}` }));
  if (!Number.isInteger(n) || n < 0 || n > 36) throw new HttpError(502, 'Could not read the token decimals.');
  decimalsCache.set(key, n);
  return n;
}

/** Finds a stock token by ticker ("NVDA"), contract address or company name ("nvidia"). */
export async function findStock(query: string): Promise<RobinhoodToken | null> {
  const q = query.trim();
  if (!q) return null;
  const tokens = await getRobinhoodTokens();
  if (/^0x[a-fA-F0-9]{40}$/.test(q)) return tokens.find((t) => t.contract.toLowerCase() === q.toLowerCase()) || null;
  const upper = q.toUpperCase().replace(/^\$/, '');
  const lower = q.toLowerCase();
  return tokens.find((t) => t.symbol === upper)
    || tokens.find((t) => t.name.toLowerCase() === lower)
    || tokens.find((t) => lower.length >= 4 && t.name.toLowerCase().split(/[\s,.]+/)[0] === lower.split(/\s+/)[0])
    || null;
}

export type SwapQuote = {
  side: 'buy' | 'sell';
  stock: { symbol: string; name: string; logo: string | null; contract: string; decimals: number };
  tokenIn: { address: string; symbol: string; decimals: number };
  tokenOut: { address: string; symbol: string; decimals: number };
  amountIn: string;
  amountInDisplay: string;
  amountOut: string;
  amountOutDisplay: string;
  minOut: string;
  minOutDisplay: string;
  amountInUsd: number | null;
  amountOutUsd: number | null;
  gasUsd: number | null;
  slippageBps: number;
  tx: { to: string; data: string; value: string } | null;
};

function units(amount: string, decimals: number) {
  const value = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(value)) throw new HttpError(400, 'Enter a valid amount.');
  const [whole, fraction = ''] = value.split('.');
  const raw = BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt((fraction + '0'.repeat(decimals)).slice(0, decimals) || '0');
  if (raw <= BigInt(0)) throw new HttpError(400, 'Enter an amount above zero.');
  return raw;
}

/**
 * Buy: `amount` is USDG to spend. Sell: `amount` is the number of stock tokens to sell for USDG.
 * With `sender`, the response also includes the router calldata to sign.
 */
export async function quoteSwap({ side, symbol, amount, sender }: { side: 'buy' | 'sell'; symbol: string; amount: string; sender?: string | null }): Promise<SwapQuote> {
  const stock = await findStock(symbol);
  if (!stock) throw new HttpError(404, `${symbol.toUpperCase()} is not a Robinhood Stock Token on Robinhood Chain.`);
  const stockDecimals = await tokenDecimals(stock.contract);
  const usdg = { address: USDG.address, symbol: USDG.symbol, decimals: USDG.decimals };
  const stk = { address: stock.contract, symbol: stock.symbol, decimals: stockDecimals };
  const [tokenIn, tokenOut] = side === 'buy' ? [usdg, stk] : [stk, usdg];
  const amountIn = units(amount, tokenIn.decimals);
  if (side === 'buy' && amountIn > BigInt(50_000) * BigInt(10) ** BigInt(USDG.decimals)) throw new HttpError(400, 'Orders above 50,000 USDG are not supported here.');

  const params = new URLSearchParams({ tokenIn: tokenIn.address, tokenOut: tokenOut.address, amountIn: amountIn.toString() });
  const route = await fetchJson<any>(`${KYBER}/routes?${params}`, { provider: 'KyberSwap', timeoutMs: 10_000, headers: HEADERS });
  const summary = route?.data?.routeSummary;
  if (route?.code !== 0 || !summary?.amountOut) throw new HttpError(404, `No liquidity for ${stock.symbol} right now.`);

  let tx: SwapQuote['tx'] = null;
  let amountOut = BigInt(summary.amountOut);
  let gasUsd: number | null = summary.gasUsd != null ? Number(summary.gasUsd) : null;
  if (sender) {
    const built = await fetchJson<any>(`${KYBER}/route/build`, {
      method: 'POST', provider: 'KyberSwap', timeoutMs: 10_000, headers: HEADERS,
      body: JSON.stringify({ routeSummary: summary, sender, recipient: sender, slippageTolerance: SLIPPAGE_BPS, deadline: Math.floor(Date.now() / 1000) + 1200, source: 'robank' })
    });
    const data = built?.data;
    if (built?.code !== 0 || !/^0x[0-9a-fA-F]+$/.test(String(data?.data || '')) || !/^0x[a-fA-F0-9]{40}$/.test(String(data?.routerAddress || ''))) {
      throw new HttpError(502, 'The swap route could not be built. Try again in a moment.');
    }
    tx = { to: data.routerAddress, data: data.data, value: String(data.transactionValue || '0') };
    amountOut = BigInt(data.amountOut || summary.amountOut);
    if (data.gasUsd != null) gasUsd = Number(data.gasUsd);
  }
  const minOut = amountOut * BigInt(10_000 - SLIPPAGE_BPS) / BigInt(10_000);
  const show = (raw: bigint, d: number) => formatUnits(raw, d, Math.min(d, 6));
  return {
    side,
    stock: { symbol: stock.symbol, name: stock.name, logo: stock.logo, contract: stock.contract, decimals: stockDecimals },
    tokenIn, tokenOut,
    amountIn: amountIn.toString(), amountInDisplay: show(amountIn, tokenIn.decimals),
    amountOut: amountOut.toString(), amountOutDisplay: show(amountOut, tokenOut.decimals),
    minOut: minOut.toString(), minOutDisplay: show(minOut, tokenOut.decimals),
    amountInUsd: summary.amountInUsd != null ? Number(summary.amountInUsd) : null,
    amountOutUsd: summary.amountOutUsd != null ? Number(summary.amountOutUsd) : null,
    gasUsd,
    slippageBps: SLIPPAGE_BPS,
    tx
  };
}
