'use client';

import { useState } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config, robinhood } from '@/lib/wagmi';
import { setQa } from '@/lib/qa';
import TxConfirm from './TxConfirm';
import EnsureWallet from './EnsureWallet';

export default function Providers({ appId, qa = false, children }: { appId: string; qa?: boolean; children: React.ReactNode }) {
  setQa(qa);
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } }));

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
          // The existing embedded EVM wallet is reused; a missing one is created on login.
          ethereum: { createOnLogin: 'all-users' },
          // Every transaction and signature is confirmed in ROBANK's own sheet (components/TxConfirm).
          showWalletUIs: false
        },
        defaultChain: robinhood,
        supportedChains: [robinhood],
        appearance: { theme: 'dark', accentColor: '#f3f4f5', walletChainType: 'ethereum-only', logo: 'https://robank.co/robank-mark.png' }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>{children}<TxConfirm /><EnsureWallet /></WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
