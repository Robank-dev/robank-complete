'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import WalletConnect from './WalletConnect';

const groups = [
  { label: 'ROBANK', links: [['/dashboard', 'Overview'], ['/agent', 'AI Agent']] },
  { label: 'CAPITAL', links: [['/vault', 'Vault'], ['/send', 'Send'], ['/receive', 'Receive'], ['/borrow', 'Borrow'], ['/assets', 'Assets']] },
  { label: 'OPERATE', links: [['/onramp', 'Buy USDC'], ['/card', 'Card']] },
  { label: 'NETWORK', links: [['/company', 'Company'], ['/markets', 'Markets'], ['/news', 'News'], ['/jobs', 'Jobs']] }
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, authenticated, user } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated) window.location.replace('/login');
  }, [ready, authenticated]);

  if (!ready || !authenticated) return null;

  return (
    <div className="ro-app-shell">
      <header className="ro-app-topbar">
        <Link href="/" className="ro-app-brand"><span className="ro-app-mark"><img src="/robank-mark.png" alt="" /></span><span>ROBANK</span></Link>
        <div className="ro-app-search"><span>Search anything</span><kbd>⌘ K</kbd></div>
        <div className="ro-app-account"><span className="ro-online" /> <span className="ro-email">{user?.email?.address ?? 'ROBANK user'}</span><WalletConnect /></div>
      </header>
      <div className="ro-app-body">
        <aside className="ro-app-sidebar">
          {groups.map((group) => (
            <div className="ro-nav-group" key={group.label}>
              <div className="ro-nav-label">{group.label}</div>
              {group.links.map(([href, label]) => (
                <Link key={href} href={href} className={pathname === href ? 'active' : ''}>{label}</Link>
              ))}
            </div>
          ))}
          <div className="ro-sidebar-footer"><b>MAINNET</b><span>Base · Robinhood Chain</span></div>
        </aside>
        <main className="ro-app-main">{children}</main>
      </div>
    </div>
  );
}
