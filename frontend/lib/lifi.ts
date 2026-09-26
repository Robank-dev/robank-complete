import { createClient, type SDKClient } from '@lifi/sdk';
import { EthereumProvider } from '@lifi/sdk-provider-ethereum';
import { SolanaProvider } from '@lifi/sdk-provider-solana';
import { createWalletClient, custom } from 'viem';
import { roBankEvmChains } from '@/lib/wagmi';

export function createRobankLifiClient({
  evmWallet,
  solanaWallet,
  currentEvmChainId,
}: {
  evmWallet: any;
  solanaWallet: any;
  currentEvmChainId: number;
}): SDKClient {
  const makeEvmClient = async (chainId: number) => {
    const chain = roBankEvmChains.find((item) => item.id === chainId) ?? roBankEvmChains[0];
    if (!evmWallet) throw new Error('EVM wallet is not available.');
    const provider = await evmWallet.getEthereumProvider();
    return createWalletClient({
      account: evmWallet.address,
      chain,
      transport: custom(provider),
    });
  };

  const ethereumProvider = EthereumProvider({
    getWalletClient: () => makeEvmClient(currentEvmChainId),
    switchChain: async (chainId) => {
      if (!evmWallet) throw new Error('EVM wallet is not available.');
      await evmWallet.switchChain(chainId);
      return makeEvmClient(chainId);
    },
  });

  const solanaProvider = SolanaProvider({
    getWallet: async () => {
      if (!solanaWallet) throw new Error('Solana wallet is not available.');
      // LI.FI expects a wallet-standard wallet; Privy exposes it on the connected wallet.
      return solanaWallet.standardWallet ?? solanaWallet;
    },
  });

  return createClient({
    integrator: 'robank',
    providers: [ethereumProvider, solanaProvider],
    routeOptions: { slippage: 0.005, order: 'CHEAPEST' },
    preloadChains: false,
    debug: false,
  });
}

