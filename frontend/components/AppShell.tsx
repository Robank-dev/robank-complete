'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import WalletConnect from './WalletConnect';

const nav = [
  ['/', 'Home'],
  ['/dashboard', 'Dashboard'],
  ['/vault', 'Vault'],
  ['/send', 'Send'],
  ['/receive', 'Receive'],
  ['/agent', 'Agent'],
  ['/onramp', 'Buy USDC'],
  ['/company', 'Company'],
  ['/markets', 'Markets'],
  ['/news', 'News'],
  ['/jobs', 'Jobs']
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, authenticated } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated) window.location.replace('/login');
  }, [ready, authenticated]);

  if (!ready || !authenticated) return null;

  return (
    <div className="min-h-screen bg-ro-bg text-white">
      <header className="border-b border-ro-line bg-black/20 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="font-mono text-lg font-bold tracking-[.18em]">ROBANK</Link>
          <WalletConnect />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 md:grid-cols-[180px_1fr]">
        <aside className="hidden md:block">
          <nav className="sticky top-6 space-y-1">
            {nav.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={`block rounded-lg px-3 py-2 text-sm ${pathname === href ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
