import { decodeFunctionResult, encodeFunctionData } from 'viem';
import { CHAINS, NATIVE_LOGOS, SOLANA_CHAIN_ID, SOLANA_TOKEN_PROGRAMS, STABLECOINS, STABLE_META, formatUnits, type Chain } from '@/lib/chains';
import { getXStocksCatalog, type XStockAsset } from '@/lib/xstocksCatalog';
import { getRobinhoodTokens, type RobinhoodToken } from '@/lib/robinhoodCatalog';
import { env } from './env';

export type Holding = {
  id: string;
  kind: 'stablecoin' | 'native' | 'xstock' | 'stock-token';
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

type Target = { kind: Holding['kind']; symbol: string; name: string; logo: string; contract: string | null; decimals: number; xstock?: XStockAsset; rh?: RobinhoodToken };
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
  for (const url of chain.rpcs) {
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

async function readSolana(owner: string, mints: Map<string, Target>) {
  const base = CHAINS.find((c) => c.id === SOLANA_CHAIN_ID)!;
  // A dedicated RPC (e.g. Helius) can be configured; public RPCs are the fallback.
  const custom = env('SOLANA_RPC_URL');
  const chain = custom.startsWith('https://') ? { ...base, rpcs: [custom, ...base.rpcs] } : base;
  // Public Solana RPCs throttle batched and indexed calls, so each read is a single request with backoff.
  const call = async (method: string, params: unknown[]) => {
    let lastError: unknown;
    for (const url of chain.rpcs) {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const body = await rpc(url, { jsonrpc: '2.0', id: 1, method, params }, 8000);
          return body.result;
        } catch (error) {
          lastError = error;
          if (!/429|too many/i.test(String((error as Error)?.message))) break;
          await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Solana read failed');
  };
  const balance = await call('getBalance', [owner, { commitment: 'confirmed' }]);
  const tokens = new Map<string, bigint>();
  for (const programId of SOLANA_TOKEN_PROGRAMS) {
    const result = await call('getTokenAccountsByOwner', [owner, { programId }, { encoding: 'jsonParsed', commitment: 'confirmed' }]);
    for (const account of result?.value || []) {
      const info = account?.account?.data?.parsed?.info;
      const mint = String(info?.mint || '');
      if (!mints.has(mint)) continue;
      try { tokens.set(mint, (tokens.get(mint) || BigInt(0)) + BigInt(String(info?.tokenAmount?.amount || '0'))); } catch {}
    }
  }
  return { lamports: BigInt(Number(balance?.value ?? 0)), tokens };
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

const NATIVE_PRICE_SOURCES: Record<string, { lifi: string; coinbase: string }> = {
  ETH: { lifi: 'chain=1&token=0x0000000000000000000000000000000000000000', coinbase: 'ETH' },
  BNB: { lifi: 'chain=56&token=0x0000000000000000000000000000000000000000', coinbase: 'BNB' },
  POL: { lifi: 'chain=137&token=0x0000000000000000000000000000000000000000', coinbase: 'POL' },
  SOL: { lifi: 'chain=SOL&token=11111111111111111111111111111111', coinbase: 'SOL' }
};

async function priceFrom(url: string, pick: (body: any) => unknown) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json', 'User-Agent': 'ROBANK/1.0' } });
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
      const response = await fetch('https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000', { signal: controller.signal, headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 ROBANK/1.0' } });
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

export async function readPortfolio(evmAddress: string, solanaAddress: string): Promise<Portfolio> {
  const [catalogResult, rhResult, natives, underlying] = await Promise.all([
    getXStocksCatalog().then((assets) => ({ ok: true as const, assets })).catch(() => ({ ok: false as const, assets: [] as XStockAsset[] })),
    (evmAddress ? getRobinhoodTokens() : Promise.resolve([] as RobinhoodToken[])).then((tokens) => ({ ok: true as const, tokens })).catch(() => ({ ok: false as const, tokens: [] as RobinhoodToken[] })),
    nativePrices(),
    underlyingPrices()
  ]);
  const sources: SourceStatus[] = [];
  if (!catalogResult.ok) sources.push({ id: 'xstocks', label: 'xStocks catalog', ok: false, error: 'xStocks holdings could not be checked.' });
  if (!rhResult.ok) sources.push({ id: 'robinhood-tokens', label: 'Robinhood Stock Tokens', ok: false, error: 'Robinhood Stock Token holdings could not be checked.' });

  const holdings: Holding[] = [];
  const xstockPrice = (asset: XStockAsset) => underlying.get(asset.underlyingSymbol) ?? null;

  const evmJobs = evmAddress ? CHAINS.filter((c) => c.type === 'evm').map(async (chain) => {
    const targets: Target[] = [
      { kind: 'native', symbol: chain.native.symbol, name: chain.native.symbol === 'ETH' ? 'Ether' : chain.native.symbol, logo: NATIVE_LOGOS[chain.native.symbol] || chain.icon, contract: null, decimals: chain.native.decimals },
      ...STABLECOINS.filter((t) => t.chainId === chain.id).map((t) => ({ kind: 'stablecoin' as const, symbol: t.symbol, name: STABLE_META[t.symbol].name, logo: STABLE_META[t.symbol].logo, contract: t.address, decimals: t.decimals })),
      ...catalogResult.assets.flatMap((asset) => asset.deployments.filter((d) => d.chainId === chain.id).map((d) => ({ kind: 'xstock' as const, symbol: asset.symbol, name: asset.name, logo: asset.logo, contract: d.address, decimals: d.decimals, xstock: asset }))),
      ...(chain.id === 4663 ? rhResult.tokens.map((t) => ({ kind: 'stock-token' as const, symbol: t.symbol, name: `${t.name} Stock Token`, logo: t.logo || chain.icon, contract: t.contract, decimals: -1, rh: t })) : [])
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
        else if (target.kind === 'native') holdings.push(holding(target, chain, raw, natives.get(chain.native.priceKey) ?? null, 'LI.FI / Coinbase spot'));
        else if (target.kind === 'stock-token') {
          const base = target.rh ? underlying.get(target.rh.symbol) : undefined;
          holdings.push(holding(target, chain, raw, base != null ? base * target.rh!.multiplier : null, 'Underlying last sale × token multiplier'));
        } else holdings.push(holding(target, chain, raw, target.xstock ? xstockPrice(target.xstock) : null, 'Underlying last sale (Nasdaq)'));
      });
      sources.push({ id: `evm:${chain.id}`, label: chain.label, ok: true });
    } catch {
      sources.push({ id: `evm:${chain.id}`, label: chain.label, ok: false, error: `${chain.label} balances could not be read right now.` });
    }
  }) : [];

  const solanaJob = solanaAddress ? (async () => {
    const chain = CHAINS.find((c) => c.id === SOLANA_CHAIN_ID)!;
    const mints = new Map<string, Target>();
    for (const t of STABLECOINS.filter((s) => s.chainId === SOLANA_CHAIN_ID)) mints.set(t.address, { kind: 'stablecoin', symbol: t.symbol, name: STABLE_META[t.symbol].name, logo: STABLE_META[t.symbol].logo, contract: t.address, decimals: t.decimals });
    for (const asset of catalogResult.assets) for (const d of asset.deployments) if (d.chainId === SOLANA_CHAIN_ID) mints.set(d.address, { kind: 'xstock', symbol: asset.symbol, name: asset.name, logo: asset.logo, contract: d.address, decimals: d.decimals, xstock: asset });
    try {
      const { lamports, tokens } = await readSolana(solanaAddress, mints);
      if (lamports > BigInt(0)) holdings.push(holding({ kind: 'native', symbol: 'SOL', name: 'Solana', logo: NATIVE_LOGOS.SOL, contract: null, decimals: 9 }, chain, lamports, natives.get('SOL') ?? null, 'LI.FI / Coinbase spot'));
      tokens.forEach((raw, mint) => {
        const target = mints.get(mint)!;
        if (raw <= BigInt(0)) return;
        if (target.kind === 'stablecoin') holdings.push(holding(target, chain, raw, 1, 'Stablecoin par'));
        else holdings.push(holding(target, chain, raw, target.xstock ? xstockPrice(target.xstock) : null, 'Underlying last sale (Nasdaq)'));
      });
      sources.push({ id: 'solana', label: 'Solana', ok: true });
    } catch {
      sources.push({ id: 'solana', label: 'Solana', ok: false, error: 'Solana balances could not be read right now.' });
    }
  })() : Promise.resolve();

  await Promise.all([...evmJobs, solanaJob]);

  holdings.sort((a, b) => (b.valueUsd ?? -1) - (a.valueUsd ?? -1) || a.symbol.localeCompare(b.symbol) || a.chainId - b.chainId);
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
