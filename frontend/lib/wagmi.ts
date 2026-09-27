import { fallback, http } from 'wagmi';
import { ROBINHOOD } from '@/lib/chains';
import { createConfig } from '@privy-io/wagmi';
import { defineChain } from 'viem';

export const robinhood = defineChain({
  id: ROBINHOOD.id,
  name: ROBINHOOD.label,
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    // ROBANK's relay first: it works on networks that block the public endpoint.
    default: { http: ['https://robank.co/api/rpc', ...ROBINHOOD.rpcs] }
  },
  blockExplorers: {
    default: { name: 'Robinhood Chain Blockscout', url: ROBINHOOD.explorer }
  }
});

export const roBankEvmChains = [robinhood] as const;

export const config = createConfig({
  chains: roBankEvmChains,
  transports: { [robinhood.id]: fallback(ROBINHOOD.rpcs.map((url) => http(url))) },
  ssr: true
});
