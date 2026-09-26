import { fallback, http } from 'wagmi';
import { chainById } from '@/lib/chains';
import { createConfig } from '@privy-io/wagmi';
import { base, mainnet, arbitrum, optimism, polygon, bsc } from 'wagmi/chains';
import { defineChain } from 'viem';


const robinhood = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.chain.robinhood.com'] }
  },
  blockExplorers: {
    default: { name: 'Robinhood Chain Blockscout', url: 'https://robinhoodchain.blockscout.com' }
  }
});

export const roBankEvmChains = [mainnet, base, arbitrum, optimism, polygon, bsc, robinhood] as const;

export const config = createConfig({
  chains: roBankEvmChains,
  transports: Object.fromEntries(roBankEvmChains.map((chain) => [chain.id, fallback(chainById(chain.id)!.rpcs.map((url) => http(url)))])) as any,
  ssr: true
});
