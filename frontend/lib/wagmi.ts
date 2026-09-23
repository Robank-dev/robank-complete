import { http } from 'wagmi';
import { createConfig } from '@privy-io/wagmi';
import { base } from 'wagmi/chains';
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

export const config = createConfig({
  chains: [base, robinhood],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
    [robinhood.id]: http('https://rpc.mainnet.chain.robinhood.com')
  },
  ssr: true
});
