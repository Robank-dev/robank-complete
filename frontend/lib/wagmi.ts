import { http } from 'wagmi';
import { createConfig } from '@privy-io/wagmi';
import { base, mainnet, arbitrum, optimism, polygon, bsc } from 'wagmi/chains';
import { defineChain } from 'viem';
import { ROBINHOOD_CHAIN_ID } from '@/lib/constants';

const robinhood = defineChain({
  id: ROBINHOOD_CHAIN_ID,
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
  transports: {
    [mainnet.id]: http('https://ethereum-rpc.publicnode.com'),
    [base.id]: http('https://mainnet.base.org'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [optimism.id]: http('https://mainnet.optimism.io'),
    [polygon.id]: http('https://polygon-bor-rpc.publicnode.com'),
    [bsc.id]: http('https://bsc-dataseed.bnbchain.org'),
    [robinhood.id]: http('https://rpc.mainnet.chain.robinhood.com')
  },
  ssr: true
});
