import { decodeFunctionResult, encodeFunctionData } from 'viem';
import { NATIVE_LOGOS, ROBINHOOD, STABLECOINS, STABLE_META, formatUnits, type Chain } from '@/lib/chains';
import { getRobinhoodTokens, type RobinhoodToken } from '@/lib/robinhoodCatalog';
import { serverRpcs } from './rpc';
import { ROBANK_TOKEN, tokenLive } from '@/lib/token';

export type Holding = {
  id: string;
  kind: 'stablecoin' | 'native' | 'stock-token' | 'token';
  symbol: string;
  name: string;
  logo: string;
  chainId: number;
  network: string;
  contract: string | null;
  decimals: number;
  raw: string;
  quantity: string;
  priceUsd: number | null;
  valueUsd: number | null;
  priceSource: string | null;
};

export type SourceStatus = { id: string; label: string; ok: boolean; error?: string };

export type Portfolio = {
  generatedAt: string;
  holdings: Holding[];
  sources: SourceStatus[];
  complete: boolean;
  totalUsd: number;
  unpricedCount: number;
};

const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11' as const;
const MULTICALL_ABI = [
  { type: 'function', name: 'aggregate3', stateMutability: 'view', inputs: [{ name: 'calls', type: 'tuple[]', components: [{ name: 'target', type: 'address' }, { name: 'allowFailure', type: 'bool' }, { name: 'callData', type: 'bytes' }] }], outputs: [{ name: 'returnData', type: 'tuple[]', components: [{ name: 'success', type: 'bool' }, { name: 'returnData', type: 'bytes' }] }] },
  { type: 'function', name: 'getEthBalance', stateMutability: 'view', inputs: [{ name: 'addr', type: 'address' }], outputs: [{ name: 'balance', type: 'uint256' }] }
] as const;
const BALANCE_ABI = [{ type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }], outputs: [{ type: 'uint256' }] }] as const;

type Target = { kind: Holding['kind']; symbol: string; name: string; logo: string; contract: string | null; decimals: number; rh?: RobinhoodToken };
const DECIMALS_ABI = [{ type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] }] as const;

async function rpc(url: string, body: unknown, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'User-Agent': 'ROBANK/1.0' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`RPC ${response.status}`);
    const data = await response.json() as any;
    if (Array.isArray(data)) return data;
    if (data?.error) throw new Error(`${data.error.code ?? ''} ${String(data.error.message || 'RPC error')}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/** Tries each RPC in order; a result is only accepted when the whole read succeeds. */
async function withFallback<T>(chain: Chain, read: (url: string) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (const url of chain.id === ROBINHOOD.id ? serverRpcs() : chain.rpcs) {
    try { return await read(url); } catch (error) { lastError = error; }
  }
  throw lastError instanceof Error ? lastError : new Error('All RPCs failed');
}

async function readEvmChain(chain: Chain, owner: `0x${string}`, targets: Target[]) {
  const results = new Map<number, bigint>();
  const nativeIndex = targets.findIndex((t) => t.kind === 'native');
  const calls = targets.map((t) => t.kind === 'native'
    ? { target: MULTICALL3, allowFailure: true, callData: encodeFunctionData({ abi: MULTICALL_ABI, functionName: 'getEthBalance', args: [owner] }) }
    : { target: t.contract as `0x${string}`, allowFailure: true, callData: encodeFunctionData({ abi: BALANCE_ABI, functionName: 'balanceOf', args: [owner] }) });

  const readMulticall = async (url: string) => {
    const chunks: typeof calls[] = [];
    for (let i = 0; i < calls.length; i += 300) chunks.push(calls.slice(i, i + 300));
    const decoded: Array<{ success: boolean; returnData: `0x${string}` }> = [];
    for (const chunk of chunks) {
      const body = await rpc(url, { jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: MULTICALL3, data: encodeFunctionData({ abi: MULTICALL_ABI, functionName: 'aggregate3', args: [chunk] }) }, 'latest'] }, 7000);
      const out = decodeFunctionResult({ abi: MULTICALL_ABI, functionName: 'aggregate3', data: String(body?.result || '0x') as `0x${string}` }) as Array<{ success: boolean; returnData: `0x${string}` }>;
      if (out.length !== chunk.length) throw new Error('Multicall length mismatch');
      decoded.push(...out);
    }
    return decoded;
  };

  try {
    const decoded = await withFallback(chain, readMulticall);
    decoded.forEach((item, index) => {
      if (item.success && item.returnData && item.returnData !== '0x') {
        try { results.set(index, BigInt(item.returnData.slice(0, 66))); } catch {}
      }
    });
    return results;
  } catch {
    // Multicall3 unavailable on this network: fall back to a plain JSON-RPC batch for the core assets only.
    const core = targets.map((t, index) => ({ t, index })).filter(({ t }) => t.kind === 'native' || t.kind === 'stablecoin');
    const batch = core.map(({ t, index }) => t.kind === 'native'
      ? { jsonrpc: '2.0', id: index, method: 'eth_getBalance', params: [owner, 'latest'] }
      : { jsonrpc: '2.0', id: index, method: 'eth_call', params: [{ to: t.contract, data: encodeFunctionData({ abi: BALANCE_ABI, functionName: 'balanceOf', args: [owner] }) }, 'latest'] });
    const rows = await withFallback(chain, async (url) => {
      const out = await rpc(url, batch, 7000);
      if (!Array.isArray(out) || out.some((row: any) => row?.error)) throw new Error('Batch failed');
      return out as Array<{ id: number; result: string }>;
    });
    for (const row of rows) {
      try { results.set(Number(row.id), BigInt(row.result || '0x0')); } catch {}
    }
    if (nativeIndex >= 0 && !results.has(nativeIndex)) throw new Error('Native balance unavailable');
    return results;
  }
}

async function readDecimals(chain: Chain, contracts: `0x${string}`[]): Promise<number[]> {
  const calls = contracts.map((target) => ({ target, allowFailure: true, callData: encodeFunctionData({ abi: DECIMALS_ABI, functionName: 'decimals' }) }));
  return withFallback(chain, async (url) => {
    const body = await rpc(url, { jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to: MULTICALL3, data: encodeFunctionData({ abi: MULTICALL_ABI, functionName: 'aggregate3', args: [calls] }) }, 'latest'] }, 7000);
    const out = decodeFunctionResult({ abi: MULTICALL_ABI, functionName: 'aggregate3', data: String(body?.result || '0x') as `0x${string}` }) as Array<{ success: boolean; returnData: `0x${string}` }>;
    return out.map((item) => {
      const n = item.success ? Number(BigInt(item.returnData.slice(0, 66))) : NaN;
      if (!Number.isInteger(n) || n < 0 || n > 36) throw new Error('Invalid token decimals');
      return n;
    });
  });
}

const priceCache = new Map<string, { at: number; prices: Map<string, number> }>();

async function cachedPrices(key: string, ttlMs: number, load: () => Promise<Map<string, number>>) {
  const hit = priceCache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.prices;
  try {
    const prices = await load();
    if (prices.size) priceCache.set(key, { at: Date.now(), prices });
    return prices;
  } catch {
    return hit?.prices || new Map<string, number>();
  }
}

// Robinhood Chain pays gas in ETH; the reference price comes from the ETH mainnet quote.
const NATIVE_PRICE_SOURCES: Record<string, { lifi: string; coinbase: string }> = {
  ETH: { lifi: 'chain=1&token=0x0000000000000000000000000000000000000000', coinbase: 'ETH' }
};

async function priceFrom(url: string, pick: (body: any) => unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    // Cached at Cloudflare's edge so a cold Worker isolate does not wait on the price API.
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json', 'User-Agent': 'ROBANK/1.0' }, cf: { cacheTtl: 60, cacheEverything: true } } as RequestInit);
    if (!response.ok) return null;
    const price = Number(pick(await response.json()));
    return Number.isFinite(price) && price > 0 ? price : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function nativePrices() {
  return cachedPrices('native', 60_000, async () => {
    const out = new Map<string, number>();
    await Promise.all(Object.entries(NATIVE_PRICE_SOURCES).map(async ([symbol, source]) => {
      const price = await priceFrom(`https://li.quest/v1/token?${source.lifi}`, (b) => b?.priceUSD)
        ?? await priceFrom(`https://api.coinbase.com/v2/prices/${source.coinbase}-USD/spot`, (b) => b?.data?.amount);
      if (price != null) out.set(symbol, price);
    }));
    return out;
  });
}

export async function underlyingPrices() {
  return cachedPrices('nasdaq', 120_000, async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch('https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000', { signal: controller.signal, headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 ROBANK/1.0' }, cf: { cacheTtl: 120, cacheEverything: true } } as RequestInit);
      const body = await response.json() as any;
      const out = new Map<string, number>();
      for (const row of body?.data?.table?.rows || []) {
        const ticker = String(row?.symbol || '').trim().toUpperCase();
        const price = Number(String(row?.lastsale || '').replace(/[$,\s]/g, ''));
        if (ticker && Number.isFinite(price) && price > 0) out.set(ticker, price);
      }
      return out;
    } finally {
      clearTimeout(timer);
    }
  });
}

function holding(target: Target, chain: Chain, raw: bigint, price: number | null, priceSource: string | null): Holding {
  const quantity = formatUnits(raw, target.decimals, Math.min(target.decimals, 8));
  const value = price != null ? Number(formatUnits(raw, target.decimals, 8)) * price : null;
  return {
    id: `${chain.id}:${target.contract || 'native'}`,
    kind: target.kind,
    symbol: target.symbol,
    name: target.name,
    logo: target.logo,
    chainId: chain.id,
    network: chain.label,
    contract: target.contract,
    decimals: target.decimals,
    raw: raw.toString(),
    quantity,
    priceUsd: price,
    valueUsd: value != null && Number.isFinite(value) ? value : null,
    priceSource
  };
}

export async function readPortfolio(evmAddress: string): Promise<Portfolio> {
  const [rhResult, natives, underlying] = await Promise.all([
    (evmAddress ? getRobinhoodTokens() : Promise.resolve([] as RobinhoodToken[])).then((tokens) => ({ ok: true as const, tokens })).catch(() => ({ ok: false as const, tokens: [] as RobinhoodToken[] })),
    nativePrices(),
    underlyingPrices()
  ]);
  const sources: SourceStatus[] = [];
  if (!rhResult.ok) sources.push({ id: 'robinhood-tokens', label: 'Robinhood Stock Tokens', ok: false, error: 'Robinhood Stock Token holdings could not be checked.' });

  const holdings: Holding[] = [];
  const chain = ROBINHOOD;

  if (evmAddress) {
    const targets: Target[] = [
      { kind: 'native', symbol: chain.native.symbol, name: 'Ether', logo: NATIVE_LOGOS[chain.native.symbol] || chain.icon, contract: null, decimals: chain.native.decimals },
      ...STABLECOINS.map((t) => ({ kind: 'stablecoin' as const, symbol: t.symbol, name: STABLE_META[t.symbol].name, logo: STABLE_META[t.symbol].logo, contract: t.address, decimals: t.decimals })),
      ...(tokenLive() ? [{ kind: 'token' as const, symbol: ROBANK_TOKEN.symbol, name: ROBANK_TOKEN.name, logo: ROBANK_TOKEN.logo, contract: ROBANK_TOKEN.address, decimals: -1 }] : []),
      ...rhResult.tokens.map((t) => ({ kind: 'stock-token' as const, symbol: t.symbol, name: `${t.name} Stock Token`, logo: t.logo || chain.icon, contract: t.contract, decimals: -1, rh: t }))
    ];
    try {
      const balances = await readEvmChain(chain, evmAddress as `0x${string}`, targets);
      // Stock Token decimals are read from the contract for the (few) tokens actually held.
      const held = [...balances.entries()].filter(([index, raw]) => raw > BigInt(0) && targets[index].decimals < 0);
      if (held.length) {
        const decimals = await readDecimals(chain, held.map(([index]) => targets[index].contract as `0x${string}`));
        held.forEach(([index], i) => { targets[index] = { ...targets[index], decimals: decimals[i] }; });
      }
      balances.forEach((raw, index) => {
        if (raw <= BigInt(0)) return;
        const target = targets[index];
        if (target.decimals < 0) return;
        if (target.kind === 'stablecoin') holdings.push(holding(target, chain, raw, 1, 'Stablecoin par'));
        else if (target.kind === 'token') holdings.push(holding(target, chain, raw, null, null));
        else if (target.kind === 'native') holdings.push(holding(target, chain, raw, natives.get(chain.native.priceKey) ?? null, 'LI.FI / Coinbase spot'));
        else {
          const base = target.rh ? underlying.get(target.rh.symbol) : undefined;
          holdings.push(holding(target, chain, raw, base != null ? base * target.rh!.multiplier : null, 'Underlying last sale × token multiplier'));
        }
      });
      sources.push({ id: `evm:${chain.id}`, label: chain.label, ok: true });
    } catch {
      sources.push({ id: `evm:${chain.id}`, label: chain.label, ok: false, error: `${chain.label} balances could not be read right now.` });
    }
  }

  holdings.sort((a, b) => (b.valueUsd ?? -1) - (a.valueUsd ?? -1) || a.symbol.localeCompare(b.symbol));
  const totalUsd = holdings.reduce((sum, h) => sum + (h.valueUsd ?? 0), 0);
  return {
    generatedAt: new Date().toISOString(),
    holdings,
    sources: sources.sort((a, b) => a.label.localeCompare(b.label)),
    complete: sources.every((s) => s.ok),
    totalUsd,
    unpricedCount: holdings.filter((h) => h.valueUsd == null).length
  };
}
