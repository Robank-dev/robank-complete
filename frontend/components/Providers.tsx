'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from '@privy-io/wagmi';
import { useEffect, useState } from 'react';
import { config } from '@/lib/wagmi';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [appId, setAppId] = useState<string>(() => process.env.NEXT_PUBLIC_PRIVY_APP_ID || '');
  const [configError, setConfigError] = useState('');

  useEffect(() => {
    if (appId) return;
    let cancelled = false;
    fetch('/api/privy-config', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.appId) {
          throw new Error(data?.error || 'Privy app is not configured.');
        }
        if (!cancelled) setAppId(String(data.appId));
      })
      .catch((error) => {
        if (!cancelled) setConfigError(error instanceof Error ? error.message : 'Privy app is not configured.');
      });
    return () => { cancelled = true; };
  }, [appId]);

  if (!appId) {
    return (
      <main className="min-h-screen bg-ro-bg p-8 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-ro-line p-6">
          <b>{configError ? 'ROBANK authentication is not configured.' : 'Loading ROBANK authentication…'}</b>
          <p className="mt-2 text-sm text-white/55">{configError || 'Connecting to the secure Privy configuration.'}</p>
        </div>
      </main>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email'],
        embeddedWallets: {
          // Let Privy own wallet provisioning. "all-users" is evaluated per chain:
          // existing embedded wallets are reused; missing EVM/Solana wallets are created on login.
          ethereum: { createOnLogin: 'all-users' },
          solana: { createOnLogin: 'all-users' }
        },
        appearance: {
          walletChainType: 'ethereum-and-solana'
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
