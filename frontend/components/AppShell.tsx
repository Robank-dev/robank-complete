'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import SystemBanner from './SystemBanner';

const groups = [
  { label: 'ROBANK', links: [['/dashboard', 'Overview', 'grid'], ['/agent', 'AI Agent', 'spark']] },
  { label: 'CAPITAL', links: [['/borrow', 'Borrow', 'credit'], ['/xstocks', 'Stocks', 'stocks']] },
  { label: 'OPERATE', links: [['/card', 'Card', 'card']] },
  { label: 'NETWORK', links: [['/company', 'Company', 'building'], ['/markets', 'Markets', 'chart'], ['/updates', 'Updates', 'feed'], ['/jobs', 'Jobs', 'briefcase']] }
] as const;

function Icon({ name }: { name: string }) {
  const common = { width: 17, height: 17, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    spark: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    'arrow-up': <><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></>,
    'arrow-down': <><path d="M12 5v14"/><path d="M18 13l-6 6-6-6"/></>,
    credit: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/></>,
    layers: <><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/><path d="M3 16l9 5 9-5"/></>,
    swap: <><path d="M7 7h11"/><path d="m15 3 4 4-4 4"/><path d="M17 17H6"/><path d="m9 13-4 4 4 4"/></>,
    plus: <><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h5"/></>,
    building: <><path d="M4 21V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v17"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/></>,
    chart: <><path d="M4 19V10M10 19V5M16 19v-8M22 19H2"/></>,
    stocks: <><path d="M4 19V5h16v14H4z"/><path d="M8 16v-4M12 16V8M16 16v-6"/></>,
    feed: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2M3 12h18"/></>,
    gift: <><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8v12M3 12h18M5 8h14M8 8c-2.2 0-3.3-3.2-.8-3.2 2.3 0 4.8 3.2 4.8 3.2M16 8c2.2 0 3.3-3.2.8-3.2-2.3 0-4.8 3.2-4.8 3.2"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  const [displayName, setDisplayName] = useState('User');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const wallet = wallets.find((item) => item.walletClientType === 'privy');

  useEffect(() => {
    const key = user?.id ? `robank.profile.${user.id}` : '';
    const load = () => {
      if (!key) { setDisplayName('User'); setProfilePhoto(''); return; }
      try {
        const saved = JSON.parse(localStorage.getItem(key) || '{}');
        setDisplayName(typeof saved.name === 'string' && saved.name.trim() ? saved.name.trim() : 'User');
        setProfilePhoto(typeof saved.photo === 'string' ? saved.photo : '');
      } catch {
        setDisplayName('User');
        setProfilePhoto('');
      }
    };
    load();
    window.addEventListener('robank-profile-updated', load);
    return () => window.removeEventListener('robank-profile-updated', load);
  }, [user?.id]);

  useEffect(() => {
    if (ready && !authenticated) window.location.replace('/login');
  }, [ready, authenticated]);

  if (!ready) return <main className="ro-app-loading"><span className="ro-loading-dot" /> LOADING ROBANK</main>;
  if (!authenticated) return null;

  const name = displayName || 'User';

  return (
    <div className="ro-app-shell">
      <header className="ro-app-topbar">
        <SystemBanner />
      </header>
      <div className="ro-app-body">
        <aside className="ro-app-sidebar">
          <Link href="/dashboard" className="ro-system-brand ro-system-brand-logo" aria-label="ROBANK dashboard">
            <img src="/robank-mark.png" alt="ROBANK" />
            <span>ROBANK</span>
          </Link>
          {groups.map((group) => <div className="ro-nav-group" key={group.label}>
            <div className="ro-nav-label">{group.label}</div>
            {group.links.map(([href, label, icon]) => (
              <Link key={href} href={href} className={pathname === href ? 'active' : ''}>
                <Icon name={icon} /><span className="flex-1">{label}</span>
              </Link>
            ))}
          </div>)}
          <div className="ro-sidebar-account">
            <button type="button" className="ro-sidebar-account-trigger" onClick={() => setAccountOpen((value) => !value)}>
              <span className="ro-account-avatar">{profilePhoto ? <img src={profilePhoto} alt="" /> : <Icon name="grid" />}<span className="ro-live-dot" /></span>
              <span className="ro-account-copy"><b>{name}</b><small>{user?.email?.address ?? 'ROBANK user'}</small></span>
              <span className="ro-account-chevron">{accountOpen ? '⌃' : '⌄'}</span>
            </button>
            {accountOpen && <div className="ro-sidebar-account-menu">
              <div><span>WALLET</span><b>{wallet?.address ? wallet.address.slice(0, 6) + '…' + wallet.address.slice(-4) : 'Preparing…'}</b></div>
              <button type="button" onClick={() => logout()}>Sign out <span>→</span></button>
            </div>}
          </div>
        </aside>
        <main className="ro-app-main">{children}</main>
      </div>
    </div>
  );
}
