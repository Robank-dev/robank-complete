'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from '@privy-io/wagmi';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { config } from '@/lib/wagmi';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const pathname = usePathname();
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appRoutes = ['/login', '/dashboard', '/send', '/receive', '/vault', '/agent', '/onramp', '/borrow', '/card', '/assets', '/company', '/jobs', '/markets', '/news'];

  if (!appId) {
    const requiresPrivy = appRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
    return requiresPrivy ? (
      <main className="min-h-screen bg-ro-bg p-8 text-white"><div className="mx-auto max-w-xl rounded-2xl border border-ro-line p-6"><b>ROBANK authentication is not configured.</b><p className="mt-2 text-sm text-white/55">Set NEXT_PUBLIC_PRIVY_APP_ID before using the app.</p></div></main>
    ) : <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ['email'],
        embeddedWallets: {
          ethereum: { createOnLogin: 'all-users' },
          solana: { createOnLogin: 'off' }
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
