// Single source of truth for the network and stablecoin used by the app, the API and the agent.
// ROBANK runs on Robinhood Chain only. Every contract address below was checked on-chain for symbol and decimals.

export const ROBINHOOD_CHAIN_ID = 4663;

export type ChainKey = 'robinhood';

export type Chain = {
  id: number;
  key: ChainKey;
  label: string;
  type: 'evm';
  icon: string;
  native: { symbol: string; decimals: number; priceKey: string };
  rpcs: string[];
  explorer: string;
};

export const ROBINHOOD: Chain = {
  id: ROBINHOOD_CHAIN_ID,
  key: 'robinhood',
  label: 'Robinhood Chain',
  type: 'evm',
  icon: '/chain-icons/robinhood.svg',
  native: { symbol: 'ETH', decimals: 18, priceKey: 'ETH' },
  rpcs: ['https://rpc.mainnet.chain.robinhood.com'],
  explorer: 'https://robinhoodchain.blockscout.com'
};

export const CHAINS: Chain[] = [ROBINHOOD];

export type StableSymbol = 'USDG';

export type Stablecoin = { chainId: number; symbol: StableSymbol; address: string; decimals: number };

export const USDG: Stablecoin = { chainId: ROBINHOOD_CHAIN_ID, symbol: 'USDG', address: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168', decimals: 6 };

export const STABLECOINS: Stablecoin[] = [USDG];

export const STABLE_META: Record<StableSymbol, { name: string; logo: string }> = {
  USDG: { name: 'Global Dollar', logo: '/token-icons/usdg.png' }
};

export const NATIVE_LOGOS: Record<string, string> = {
  ETH: '/token-icons/eth.png'
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
  return chain ? `${chain.explorer}/address/${address}` : '';
}

export function isEvmAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
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
