// Single source of truth for networks and stablecoins used by the app, the API and the agent.
// Every contract address below was checked on-chain for symbol and decimals.

export const SOLANA_CHAIN_ID = 1151111081099710;

export type ChainKey = 'ethereum' | 'base' | 'arbitrum' | 'optimism' | 'polygon' | 'bnb' | 'robinhood' | 'solana';

export type Chain = {
  id: number;
  key: ChainKey;
  label: string;
  type: 'evm' | 'solana';
  icon: string;
  native: { symbol: string; decimals: number; priceKey: string };
  rpcs: string[];
  explorer: string;
};

export const CHAINS: Chain[] = [
  { id: 1, key: 'ethereum', label: 'Ethereum', type: 'evm', icon: '/token-icons/ethereum.png', native: { symbol: 'ETH', decimals: 18, priceKey: 'ETH' }, rpcs: ['https://eth.drpc.org', 'https://ethereum-rpc.publicnode.com', 'https://cloudflare-eth.com'], explorer: 'https://etherscan.io' },
  { id: 8453, key: 'base', label: 'Base', type: 'evm', icon: '/chain-icons/base.svg', native: { symbol: 'ETH', decimals: 18, priceKey: 'ETH' }, rpcs: ['https://mainnet.base.org', 'https://base.drpc.org', 'https://base-rpc.publicnode.com'], explorer: 'https://basescan.org' },
  { id: 42161, key: 'arbitrum', label: 'Arbitrum', type: 'evm', icon: '/chain-icons/arbitrum.svg', native: { symbol: 'ETH', decimals: 18, priceKey: 'ETH' }, rpcs: ['https://arb1.arbitrum.io/rpc', 'https://arbitrum.drpc.org', 'https://arbitrum-one-rpc.publicnode.com'], explorer: 'https://arbiscan.io' },
  { id: 10, key: 'optimism', label: 'Optimism', type: 'evm', icon: '/chain-icons/optimism.svg', native: { symbol: 'ETH', decimals: 18, priceKey: 'ETH' }, rpcs: ['https://mainnet.optimism.io', 'https://optimism.drpc.org', 'https://optimism-rpc.publicnode.com'], explorer: 'https://optimistic.etherscan.io' },
  { id: 137, key: 'polygon', label: 'Polygon', type: 'evm', icon: '/chain-icons/polygon.svg', native: { symbol: 'POL', decimals: 18, priceKey: 'POL' }, rpcs: ['https://polygon.drpc.org', 'https://polygon-bor-rpc.publicnode.com'], explorer: 'https://polygonscan.com' },
  { id: 56, key: 'bnb', label: 'BNB Chain', type: 'evm', icon: '/chain-icons/bnb.svg', native: { symbol: 'BNB', decimals: 18, priceKey: 'BNB' }, rpcs: ['https://bsc-dataseed.bnbchain.org', 'https://bsc-rpc.publicnode.com'], explorer: 'https://bscscan.com' },
  { id: 4663, key: 'robinhood', label: 'Robinhood Chain', type: 'evm', icon: '/chain-icons/robinhood.svg', native: { symbol: 'ETH', decimals: 18, priceKey: 'ETH' }, rpcs: ['https://rpc.mainnet.chain.robinhood.com'], explorer: 'https://robinhoodchain.blockscout.com' },
  { id: SOLANA_CHAIN_ID, key: 'solana', label: 'Solana', type: 'solana', icon: '/chain-icons/solana.svg', native: { symbol: 'SOL', decimals: 9, priceKey: 'SOL' }, rpcs: ['https://api.mainnet-beta.solana.com', 'https://solana-rpc.publicnode.com'], explorer: 'https://solscan.io' }
];

export type StableSymbol = 'USDC' | 'USDT' | 'USDG';

export type Stablecoin = { chainId: number; symbol: StableSymbol; address: string; decimals: number; programId?: string };

const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
export const SOLANA_TOKEN_PROGRAMS = [TOKEN_PROGRAM, TOKEN_2022_PROGRAM];

export const STABLECOINS: Stablecoin[] = [
  { chainId: 1, symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  { chainId: 1, symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
  { chainId: 1, symbol: 'USDG', address: '0xe343167631d89B6Ffc58B88d6b7fB0228795491D', decimals: 6 },
  { chainId: 8453, symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
  { chainId: 8453, symbol: 'USDT', address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6 },
  { chainId: 42161, symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
  { chainId: 42161, symbol: 'USDT', address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', decimals: 6 },
  { chainId: 42161, symbol: 'USDG', address: '0x004B506865409877C9fA29bfb1ebA929984B9bbC', decimals: 6 },
  { chainId: 10, symbol: 'USDC', address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', decimals: 6 },
  { chainId: 10, symbol: 'USDT', address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', decimals: 6 },
  { chainId: 137, symbol: 'USDC', address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', decimals: 6 },
  { chainId: 137, symbol: 'USDT', address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', decimals: 6 },
  { chainId: 56, symbol: 'USDC', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18 },
  { chainId: 56, symbol: 'USDT', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18 },
  { chainId: 4663, symbol: 'USDG', address: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168', decimals: 6 },
  { chainId: SOLANA_CHAIN_ID, symbol: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, programId: TOKEN_PROGRAM },
  { chainId: SOLANA_CHAIN_ID, symbol: 'USDT', address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, programId: TOKEN_PROGRAM },
  { chainId: SOLANA_CHAIN_ID, symbol: 'USDG', address: '2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH', decimals: 6, programId: TOKEN_2022_PROGRAM }
];

export const STABLE_META: Record<StableSymbol, { name: string; logo: string }> = {
  USDC: { name: 'USD Coin', logo: '/token-icons/usdc.svg' },
  USDT: { name: 'Tether USD', logo: '/token-icons/usdt.svg' },
  USDG: { name: 'Global Dollar', logo: '/token-icons/usdg.png' }
};

export const NATIVE_LOGOS: Record<string, string> = {
  ETH: '/token-icons/ethereum.png',
  SOL: '/chain-icons/solana.svg',
  BNB: '/chain-icons/bnb.svg',
  POL: '/chain-icons/polygon.svg'
};

export function chainById(id: number | string | null | undefined) {
  const n = Number(id);
  return CHAINS.find((chain) => chain.id === n);
}

export function chainByKey(key: string | null | undefined) {
  const k = String(key || '').toLowerCase();
  return CHAINS.find((chain) => chain.key === k || chain.label.toLowerCase() === k || String(chain.id) === k);
}

export function stablecoin(chainId: number, symbol: string) {
  return STABLECOINS.find((token) => token.chainId === chainId && token.symbol === symbol.toUpperCase());
}

export function stableByAddress(chainId: number, address: string) {
  const a = address.toLowerCase();
  return STABLECOINS.find((token) => token.chainId === chainId && token.address.toLowerCase() === a);
}

export function explorerTx(chainId: number, hash: string) {
  const chain = chainById(chainId);
  return chain ? `${chain.explorer}/tx/${hash}` : '';
}

export function explorerAddress(chainId: number, address: string) {
  const chain = chainById(chainId);
  return chain ? `${chain.explorer}/${chain.type === 'solana' ? 'account' : 'address'}/${address}` : '';
}

export function isEvmAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
export function isSolanaAddress(value: string) {
  return BASE58.test(value.trim());
}

export function isAddressFor(chainId: number, value: string) {
  return chainById(chainId)?.type === 'solana' ? isSolanaAddress(value) : isEvmAddress(value);
}

/** Parses a user-entered decimal amount into base units. Returns null for anything that is not a clean positive number. */
export function parseAmount(input: string, decimals: number): bigint | null {
  const value = input.trim();
  if (!/^\d+(\.\d+)?$/.test(value)) return null;
  const [whole, fraction = ''] = value.split('.');
  if (fraction.length > decimals) return null;
  try {
    const units = BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt((fraction + '0'.repeat(decimals)).slice(0, decimals) || '0');
    return units > BigInt(0) ? units : null;
  } catch {
    return null;
  }
}

export function formatUnits(raw: bigint, decimals: number, maxFraction = decimals) {
  const negative = raw < BigInt(0);
  const abs = negative ? -raw : raw;
  const base = BigInt(10) ** BigInt(decimals);
  const whole = abs / base;
  let fraction = (abs % base).toString().padStart(decimals, '0').slice(0, maxFraction).replace(/0+$/, '');
  return (negative ? '-' : '') + whole.toString() + (fraction ? '.' + fraction : '');
}
