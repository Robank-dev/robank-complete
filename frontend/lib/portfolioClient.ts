export type DirectPortfolioAsset = {
  symbol: 'USDC' | 'USDT' | 'USDG';
  name: string;
  logo: string;
  quantity: number;
  valueUsd: number;
};

type EvmToken = {
  chainId: number;
  symbol: DirectPortfolioAsset['symbol'];
  address: string;
  decimals: number;
};const EVM_RPCS: Record<number, string[]> = {
  1: ['https://ethereum-rpc.publicnode.com', 'https://cloudflare-eth.com'],
  8453: ['https://mainnet.base.org'],
  42161: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum-one-rpc.publicnode.com'],
  10: ['https://mainnet.optimism.io', 'https://optimism-rpc.publicnode.com'],
  137: ['https://polygon-bor-rpc.publicnode.com', 'https://polygon-rpc.com'],
  56: ['https://bsc-dataseed.bnbchain.org', 'https://bsc-rpc.publicnode.com'],
  4663: ['https://rpc.mainnet.chain.robinhood.com']
};

const EVM_TOKENS: EvmToken[] = [  { chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 },
  { chainId: 1, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6 },
  { chainId: 1, address: '0xe343167631d89B6Ffc58B88d6b7fB0228795491D', symbol: 'USDG', decimals: 6 },
  { chainId: 8453, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', symbol: 'USDC', decimals: 6 },
  { chainId: 8453, address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', symbol: 'USDT', decimals: 6 },
  { chainId: 42161, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', symbol: 'USDC', decimals: 6 },
  { chainId: 42161, address: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', symbol: 'USDC', decimals: 6 },
  { chainId: 42161, address: '0x004B506865409877C9fA29bfb1ebA929984B9bbC', symbol: 'USDG', decimals: 6 },
  { chainId: 10, address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', symbol: 'USDC', decimals: 6 },
  { chainId: 10, address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', symbol: 'USDT', decimals: 6 },  { chainId: 10, address: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', symbol: 'USDC', decimals: 6 },
  { chainId: 137, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', symbol: 'USDC', decimals: 6 },
  { chainId: 137, address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', symbol: 'USDT', decimals: 6 },
  { chainId: 137, address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', symbol: 'USDC', decimals: 6 },
  { chainId: 56, address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', symbol: 'USDC', decimals: 18 },
  { chainId: 56, address: '0x55d398326f99059fF775485246999027B3197955', symbol: 'USDT', decimals: 18 },
  { chainId: 4663, address: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168', symbol: 'USDG', decimals: 6 },
  { chainId: 4663, address: '0x80e0e24718dbfcad49ecaa6f1e6c89a190586ca8', symbol: 'USDC', decimals: 6 }
];const SOLANA_TOKENS = [
  { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC' as const },
  { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', symbol: 'USDT' as const }
];

const LOGOS = {
  USDC: '/token-icons/usdc.svg',
  USDT: '/token-icons/usdt.svg',
  USDG: '/token-icons/usdg.png'
} as const;

const NAMES = {
  USDC: 'USD Coin',
  USDT: 'Tether USD',
  USDG: 'Global Dollar'
} as const;

const ERC20_BALANCE = '0x70a08231';function isEvmAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function formatUnits(rawHex: string, decimals: number) {
  try {
    const raw = BigInt(rawHex);
    const base = BigInt(10) ** BigInt(decimals);
    const whole = raw / base;
    const fraction = raw % base;
    const fractionText = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
    return Number(fractionText ? whole.toString() + '.' + fractionText : whole.toString());
  } catch {
    return 0;
  }
}

async function rpcBatch(rpc: string, calls: Array<{ id: number; data: string; to: string }>) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(rpc, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calls.map((call) => ({
        jsonrpc: '2.0',
        id: call.id,
        method: 'eth_call',
        params: [{ to: call.to, data: call.data }, 'latest']
      })))
    });
    if (!response.ok) throw new Error('RPC failed');
    const body = await response.json();
    if (!Array.isArray(body)) throw new Error('Batch unsupported');
    return body as Array<{ id: number; result?: string }>;
  } finally {
    window.clearTimeout(timer);
  }
}async function rpcSingle(rpc: string, call: { data: string; to: string }) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(rpc, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: call.to, data: call.data }, 'latest']
      })
    });
    if (!response.ok) throw new Error('RPC failed');
    const body = await response.json();
    return typeof body?.result === 'string' ? body.result : '0x0';
  } finally {
    window.clearTimeout(timer);
  }
}

async function loadEvm(evmAddress: string) {
  if (!isEvmAddress(evmAddress)) return [] as DirectPortfolioAsset[];  const groups = new Map<string, DirectPortfolioAsset>();
  for (const token of EVM_TOKENS) {
    if (!groups.has(token.symbol)) {
      groups.set(token.symbol, {
        symbol: token.symbol,
        name: NAMES[token.symbol],
        logo: LOGOS[token.symbol],
        quantity: 0,
        valueUsd: 0
      });
    }
  }

  const byChain = new Map<number, EvmToken[]>();
  for (const token of EVM_TOKENS) {
    const list = byChain.get(token.chainId) || [];
    list.push(token);
    byChain.set(token.chainId, list);
  }

  await Promise.all([...byChain.entries()].map(async ([chainId, tokens]) => {
    const rpcs = EVM_RPCS[chainId] || [];
    if (!rpcs.length) return;
    const calls = tokens.map((token, index) => ({
      id: index + 1,
      to: token.address,
      data: ERC20_BALANCE + evmAddress.slice(2).padStart(64, '0')
    }));    let results: Array<{ id: number; result?: string }> | null = null;
    for (const rpc of rpcs) {
      try {
        results = await rpcBatch(rpc, calls);
        break;
      } catch {
        try {
          const single = await Promise.all(calls.map(async (call) => ({
            id: call.id,
            result: await rpcSingle(rpc, call)
          })));
          results = single;
          break;
        } catch {
          continue;
        }
      }
    }
    if (!results) return;

    for (const result of results) {
      const token = tokens[result.id - 1];
      if (!token) continue;
      const quantity = formatUnits(String(result.result || '0x0'), token.decimals);
      const group = groups.get(token.symbol);
      if (group) group.quantity += quantity;
    }
  }));

  return [...groups.values()].filter((asset) => asset.quantity > 0).map((asset) => ({
    ...asset,
    valueUsd: asset.quantity
  }));
}async function loadSolana(solanaAddress: string) {
  if (!solanaAddress) return [] as DirectPortfolioAsset[];
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch('https://solana-rpc.publicnode.com', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTokenAccountsByOwner',
        params: [solanaAddress, { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }, { encoding: 'jsonParsed' }]
      })
    });
    if (!response.ok) throw new Error('Solana RPC failed');
    const body = await response.json();
    const totals = new Map<string, number>([['USDC', 0], ['USDT', 0]]);
    for (const account of body?.result?.value || []) {
      const info = account?.account?.data?.parsed?.info;
      const mint = String(info?.mint || '').toLowerCase();
      const amount = Number(info?.tokenAmount?.uiAmountString || 0);
      const match = SOLANA_TOKENS.find((token) => token.address.toLowerCase() === mint);
      if (match && Number.isFinite(amount)) totals.set(match.symbol, (totals.get(match.symbol) || 0) + amount);
    }
    return [...totals.entries()].filter(([, quantity]) => quantity > 0).map(([symbol, quantity]) => ({
      symbol: symbol as keyof typeof NAMES,
      name: NAMES[symbol as keyof typeof NAMES],
      logo: LOGOS[symbol as keyof typeof LOGOS],
      quantity,
      valueUsd: quantity
    }));
  } catch {
    return [];
  } finally {
    window.clearTimeout(timer);
  }
}export async function loadDirectPortfolio(evmAddress: string, solanaAddress: string) {
  const [evmAssets, solanaAssets] = await Promise.all([
    loadEvm(evmAddress),
    loadSolana(solanaAddress)
  ]);
  const bySymbol = new Map<string, DirectPortfolioAsset>();
  for (const asset of [...evmAssets, ...solanaAssets]) {
    const existing = bySymbol.get(asset.symbol);
    bySymbol.set(asset.symbol, existing ? {
      ...existing,
      quantity: existing.quantity + asset.quantity,
      valueUsd: existing.valueUsd + asset.valueUsd
    } : asset);
  }
  const assets = [...bySymbol.values()].sort((a, b) => b.valueUsd - a.valueUsd);
  return {
    assets,
    totalUsd: assets.reduce((sum, asset) => sum + asset.valueUsd, 0)
  };
}