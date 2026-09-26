'use client';

import { useState } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import { config } from '@/lib/wagmi';
import { SOLANA_RPC } from '@/lib/solanaTransfer';

export default function Providers({ appId, children }: { appId: string; children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }));
  const [solanaRpcs] = useState(() => ({
    'solana:mainnet': {
      rpc: createSolanaRpc(SOLANA_RPC),
      rpcSubscriptions: createSolanaRpcSubscriptions(SOLANA_RPC.replace('https://', 'wss://')),
      blockExplorerUrl: 'https://solscan.io'
    }
  }));

  if (!appId) {
    // Public pages still render; only signed-in features need Privy.
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email'],
        embeddedWallets: {
          // Existing embedded wallets are reused; missing EVM/Solana wallets are created on login.
          ethereum: { createOnLogin: 'all-users' },
          solana: { createOnLogin: 'all-users' },
          showWalletUIs: true
        },
        solana: { rpcs: solanaRpcs },
        appearance: { theme: 'dark', accentColor: '#f3f4f5', walletChainType: 'ethereum-and-solana', logo: 'https://robank.co/robank-mark.png' }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
