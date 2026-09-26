import { NextResponse } from 'next/server';
import { decodeFunctionResult, encodeFunctionData } from 'viem';
import { getXStocksCatalog, type XStockAsset } from '@/lib/xstocksCatalog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SOLANA_CHAIN_ID = 1151111081099710;
const ZERO_EVM_ADDRESS = '0x0000000000000000000000000000000000000000';
const ERC20_BALANCE = '0x70a08231';
const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11' as const;

const EVM_RPCS: Record<number, string[]> = {
  1: ['https://ethereum-rpc.publicnode.com', 'https://cloudflare-eth.com'],
  8453: ['https://mainnet.base.org'],
  42161: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one-rpc.publicnode.com'],
  10: ['https://mainnet.optimism.io', 'https://optimism-rpc.publicnode.com'],
  137: ['https://polygon-bor-rpc.publicnode.com', 'https://polygon-rpc.com'],
  56: ['https://bsc-dataseed.bnbchain.org', 'https://bsc-rpc.publicnode.com'],
  4663: ['https://rpc.mainnet.chain.robinhood.com']
};

const MULTICALL_ABI = [{
  type: 'function',
  name: 'aggregate3',
  stateMutability: 'view',
  inputs: [{
    name: 'calls',
    type: 'tuple[]',
    components: [
      { name: 'target', type: 'address' },
      { name: 'allowFailure', type: 'bool' },
      { name: 'callData', type: 'bytes' }
    ]
  }],
  outputs: [{
    name: 'returnData',
    type: 'tuple[]',
    components: [
      { name: 'success', type: 'bool' },
      { name: 'returnData', type: 'bytes' }
    ]
  }]
}] as const;

const BALANCE_ABI = [{
  type: 'function',
  name: 'balanceOf',
  stateMutability: 'view',
  inputs: [{ name: 'owner', type: 'address' }],
  outputs: [{ type: 'uint256' }]
}] as const;

function isHexAddress(value: unknown): value is string {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
}

function hexQuantityToBigInt(value: string) {
  try { return BigInt(value); } catch { return BigInt(0); }
}

function formatUnits(raw: bigint, decimals: number) {
  const base = BigInt(10) ** BigInt(decimals);
  const whole = raw / base;
  const fraction = raw % base;
  const fractionText = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  const number = Number(fractionText ? whole.toString() + '.' + fractionText : whole.toString());
  return Number.isFinite(number) ? number : 0;
}

async function fetchJson(url: string, init?: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'ROBANK/1.0',
        ...(init?.headers || {})
      }
    });
    const text = await response.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch {}
    if (!response.ok) throw new Error(body?.message || body?.error || 'Provider failed: ' + response.status);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

const STABLE_TOKENS = [
  { chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  { chainId: 1, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', name: 'Tether USD', decimals: 6 },
  { chainId: 1, address: '0xe343167631d89B6Ffc58B88d6b7fB0228795491D', symbol: 'USDG', name: 'USDG', decimals: 6 },
  { chainId: 8453, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', name: 'USDC', decimals: 6 },
  { chainId: 8453, address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', symbol: 'USDT', name: 'USDT', decimals: 6 },
  { chainId: 42161, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', name: 'USDC', decimals: 6 },
  { chainId: 42161, address: '0x004B506865409877C9fA29bfb1ebA929984B9bbC', symbol: 'USDG', name: 'USDG', decimals: 6 },
  { chainId: 10, address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', name: 'USDC', decimals: 6 },
  { chainId: 10, address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', name: 'USDT', decimals: 6 },
  { chainId: 137, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', name: 'USDC', decimals: 6 },
  { chainId: 137, address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', name: 'USDT', decimals: 6 },
  { chainId: 56, address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', name: 'USDC', decimals: 18 },
  { chainId: 56, address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', name: 'USDT', decimals: 18 },
  { chainId: 4663, address: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168', symbol: 'USDG', name: 'USDG', decimals: 6 },
  { chainId: SOLANA_CHAIN_ID, address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USDC', decimals: 6 },
  { chainId: SOLANA_CHAIN_ID, address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT', name: 'USDT', decimals: 6 }
] as const;

const STABLE_LOGOS: Record<string, string> = {
  USDC: '/token-icons/usdc.svg',
  USDT: '/token-icons/usdt.svg',
  USDG: '/token-icons/usdg.png'
};

async function evmCall(rpc: string, data: string, to: string) {
  return fetchJson(rpc, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to, data }, 'latest']
    })
  }, 3500);
}async function evmStableBalances(owner: string) {
  const groups = new Map<string, number>([['USDC', 0], ['USDT', 0], ['USDG', 0]]);
  if (!isHexAddress(owner)) return groups;

  await Promise.all(STABLE_TOKENS.filter((token) => token.chainId !== SOLANA_CHAIN_ID).map(async (token) => {
    const rpcs = EVM_RPCS[token.chainId] || [];
    const data = ERC20_BALANCE + owner.slice(2).padStart(64, '0');
    for (const rpc of rpcs) {
      try {
        const body = await evmCall(rpc, data, token.address);
        const quantity = formatUnits(hexQuantityToBigInt(String(body?.result || '0x0')), token.decimals);
        if (quantity > 0) groups.set(token.symbol, (groups.get(token.symbol) || 0) + quantity);
        break;
      } catch {}
    }
  }));

  return groups;
}

async function solanaBalances(owner: string) {
  const result = new Map<string, number>([['USDC', 0], ['USDT', 0]]);
  if (!owner) return result;

  const wanted = new Map<string, string>();
  for (const token of STABLE_TOKENS.filter((item) => item.chainId === SOLANA_CHAIN_ID)) {
    wanted.set(token.address.toLowerCase(), token.symbol);
  }

  for (const programId of [
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
  ]) {
    try {
      const body = await fetchJson('https://solana-rpc.publicnode.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenAccountsByOwner',
          params: [owner, { programId }, { encoding: 'jsonParsed' }]
        })
      }, 5000);
      for (const account of body?.result?.value || []) {
        const info = account?.account?.data?.parsed?.info;
        const mint = String(info?.mint || '').toLowerCase();
        const symbol = wanted.get(mint);
        const amount = Number(info?.tokenAmount?.uiAmountString ?? info?.tokenAmount?.uiAmount ?? 0);
        if (symbol && Number.isFinite(amount)) {
          result.set(symbol, (result.get(symbol) || 0) + amount);
        }
      }
    } catch {}
  }
  return result;
}

async function readXStockEvmBalances(owner: string, catalog: XStockAsset[]) {
  const holdings: Array<any> = [];
  if (!isHexAddress(owner)) return holdings;

  const byChain = new Map<number, Array<{ asset: XStockAsset; deployment: XStockAsset['deployments'][number] }>>();
  for (const asset of catalog) {
    for (const deployment of asset.deployments) {
      if (!EVM_RPCS[deployment.chainId] || !isHexAddress(deployment.address)) continue;
      const list = byChain.get(deployment.chainId) || [];
      list.push({ asset, deployment });
      byChain.set(deployment.chainId, list);
    }
  }

  const jobs: Array<{ chainId: number; items: Array<{ asset: XStockAsset; deployment: XStockAsset['deployments'][number] }> }> = [];
  for (const [chainId, items] of byChain) {
    for (let i = 0; i < items.length; i += 200) jobs.push({ chainId, items: items.slice(i, i + 200) });
  }  await Promise.all(jobs.map(async ({ chainId, items }) => {
    const calls = items.map((item) => ({
      target: item.deployment.address as `0x${string}`,
      allowFailure: true,
      callData: encodeFunctionData({
        abi: BALANCE_ABI,
        functionName: 'balanceOf',
        args: [owner as `0x${string}`]
      })
    }));

    for (const rpc of EVM_RPCS[chainId] || []) {
      try {
        const data = encodeFunctionData({
          abi: MULTICALL_ABI,
          functionName: 'aggregate3',
          args: [calls]
        });
        const body = await evmCall(rpc, data, MULTICALL3);
        const decoded = decodeFunctionResult({
          abi: MULTICALL_ABI,
          functionName: 'aggregate3',
          data: (String(body?.result || '0x') as `0x${string}`)
        }) as Array<{ success: boolean; returnData: string }>;

        decoded.forEach((result, index) => {
          if (!result?.success || !result.returnData || result.returnData === '0x') return;
          const raw = hexQuantityToBigInt(result.returnData);
          const quantity = formatUnits(raw, items[index].deployment.decimals || 18);
          if (quantity > 0) holdings.push({
            asset: items[index].asset,
            deployment: items[index].deployment,
            quantity
          });
        });
        break;
      } catch {
        // Keep one deterministic fallback for networks where Multicall3 is unavailable.
        const limited = items.slice(0, 80);
        await Promise.all(limited.map(async (item) => {
          const data = encodeFunctionData({
            abi: BALANCE_ABI,
            functionName: 'balanceOf',
            args: [owner as `0x${string}`]
          });
          try {
            const body = await evmCall(rpc, data, item.deployment.address);
            const raw = hexQuantityToBigInt(String(body?.result || '0x0'));
            const quantity = formatUnits(raw, item.deployment.decimals || 18);
            if (quantity > 0) holdings.push({ asset: item.asset, deployment: item.deployment, quantity });
          } catch {}
        }));
        break;
      }
    }
  }));

  return holdings;
}

async function readXStockSolanaBalances(owner: string, catalog: XStockAsset[]) {
  if (!owner) return [] as Array<any>;
  const byMint = new Map<string, { asset: XStockAsset; deployment: XStockAsset['deployments'][number] }>();
  for (const asset of catalog) {
    for (const deployment of asset.deployments) {
      if (deployment.chainId === SOLANA_CHAIN_ID) byMint.set(deployment.address.toLowerCase(), { asset, deployment });
    }
  }
  if (!byMint.size) return [];

  const holdings = new Map<string, number>();
  for (const programId of [
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'
  ]) {
    try {
      const body = await fetchJson('https://solana-rpc.publicnode.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenAccountsByOwner',
          params: [owner, { programId }, { encoding: 'jsonParsed' }]
        })
      }, 6000);
      for (const account of body?.result?.value || []) {
        const info = account?.account?.data?.parsed?.info;
        const mint = String(info?.mint || '').toLowerCase();
        if (!byMint.has(mint)) continue;
        const amount = Number(info?.tokenAmount?.uiAmountString ?? info?.tokenAmount?.uiAmount ?? 0);
        if (Number.isFinite(amount)) holdings.set(mint, (holdings.get(mint) || 0) + amount);
      }
    } catch {}
  }

  return [...holdings.entries()]
    .filter(([, quantity]) => quantity > 0)
    .map(([mint, quantity]) => {
      const item = byMint.get(mint)!;
      return { asset: item.asset, deployment: item.deployment, quantity };
    });
}async function getNasdaqPrices() {
  try {
    const body = await fetchJson('https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=5000', {
      headers: { Accept: 'application/json', 'User-Agent': 'ROBANK/1.0' }
    }, 7000);
    const map = new Map<string, number>();
    for (const row of body?.data?.table?.rows || []) {
      const ticker = String(row?.symbol || '').trim().toUpperCase();
      const price = Number(String(row?.lastsale || '').replace(/[$,%\s,]/g, ''));
      if (ticker && Number.isFinite(price)) map.set(ticker, price);
    }
    return map;
  } catch {
    return new Map<string, number>();
  }
}

const XSTOCK_PRICE_CACHE = new Map<string, { at: number; price: number | null }>();

async function getXStockPrice(symbol: string, network: string, nasdaq: Map<string, number>, underlying: string) {
  const key = symbol + ':' + network;
  const cached = XSTOCK_PRICE_CACHE.get(key);
  if (cached && Date.now() - cached.at < 60_000) return cached.price;

  const nasdaqPrice = nasdaq.get(underlying.toUpperCase()) ?? null;
  if (nasdaqPrice !== null && Number.isFinite(nasdaqPrice)) {
    XSTOCK_PRICE_CACHE.set(key, { at: Date.now(), price: nasdaqPrice });
    return nasdaqPrice;
  }

  try {
    const body = await fetchJson(
      'https://api.xstocks.fi/api/v2/public/assets/' + encodeURIComponent(symbol) +
      '/price-data?network=' + encodeURIComponent(network),
      undefined,
      4000
    );
    const candidates = [
      body?.price,
      body?.data?.price,
      body?.quote?.price,
      body?.priceData?.price,
      body?.data?.midPrice
    ];
    const price = candidates.map(Number).find((value) => Number.isFinite(value) && value > 0) ?? null;
    XSTOCK_PRICE_CACHE.set(key, { at: Date.now(), price });
    return price;
  } catch {
    XSTOCK_PRICE_CACHE.set(key, { at: Date.now(), price: null });
    return null;
  }
}export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawEvmAddress = url.searchParams.get('evmAddress') || '';
  const evmAddress = isHexAddress(rawEvmAddress) && rawEvmAddress.toLowerCase() !== ZERO_EVM_ADDRESS ? rawEvmAddress : '';
  const solanaAddress = url.searchParams.get('solanaAddress') || '';

  const [stableEvm, stableSolana, catalog, nasdaq] = await Promise.all([
    evmStableBalances(evmAddress),
    solanaBalances(solanaAddress),
    getXStocksCatalog().catch(() => [] as XStockAsset[]),
    getNasdaqPrices()
  ]);

  const assets: any[] = [];

  for (const [symbol, quantity] of stableEvm) {
    if (quantity > 0) {
      assets.push({
        symbol,
        name: symbol,
        logo: STABLE_LOGOS[symbol],
        quantity,
        valueUsd: quantity,
        assetType: 'stablecoin'
      });
    }
  }

  for (const [symbol, quantity] of stableSolana) {
    if (quantity > 0) {
      assets.push({
        symbol,
        name: symbol,
        logo: STABLE_LOGOS[symbol],
        quantity,
        valueUsd: quantity,
        assetType: 'stablecoin',
        network: 'Solana',
        chainId: SOLANA_CHAIN_ID
      });
    }
  }

  const [xstockEvm, xstockSolana] = await Promise.all([
    readXStockEvmBalances(evmAddress, catalog),
    readXStockSolanaBalances(solanaAddress, catalog)
  ]);
  const xstockHoldings = [...xstockEvm, ...xstockSolana];

  const priced = await Promise.all(xstockHoldings.map(async (holding) => {
    const price = await getXStockPrice(
      holding.asset.symbol,
      holding.deployment.network,
      nasdaq,
      holding.asset.underlyingSymbol
    );
    return { ...holding, price };
  }));

  for (const holding of priced) {
    if (!holding.quantity) continue;
    const valueUsd = holding.price && holding.price > 0 ? holding.quantity * holding.price : 0;
    assets.push({
      symbol: holding.asset.symbol,
      name: holding.asset.name,
      logo: holding.asset.logo,
      quantity: holding.quantity,
      valueUsd,
      assetType: 'xstock',
      network: holding.deployment.network,
      chainId: holding.deployment.chainId,
      contractAddress: holding.deployment.address,
      decimals: holding.deployment.decimals || 18
    });
  }

  const totalUsd = assets.reduce((sum, asset) => sum + Number(asset.valueUsd || 0), 0);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    supportedAssets: ['USDC', 'USDT', 'USDG', 'xStocks'],
    assets: assets.sort((a, b) => Number(b.valueUsd || 0) - Number(a.valueUsd || 0)),
    totalUsd
  }, {
    headers: { 'Cache-Control': 'private, no-store, max-age=0' }
  });
}
