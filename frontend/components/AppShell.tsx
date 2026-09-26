'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useExportWallet as useExportSolanaWallet } from '@privy-io/react-auth/solana';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';
import { short } from '@/lib/format';
import CopyButton from './CopyButton';

type NavItem = { href: string; label: string; icon: string };

const NAV: Array<{ label: string; items: NavItem[] }> = [
  { label: 'Money', items: [{ href: '/dashboard', label: 'Overview', icon: 'grid' }, { href: '/send', label: 'Send', icon: 'up' }, { href: '/receive', label: 'Receive', icon: 'down' }, { href: '/top-up', label: 'Top up', icon: 'plus' }] },
  { label: 'Capital', items: [{ href: '/borrow', label: 'Borrow', icon: 'credit' }, { href: '/xstocks', label: 'Stocks', icon: 'stocks' }] },
  { label: 'Agent', items: [{ href: '/agent', label: 'AI Agent', icon: 'spark' }, { href: '/markets', label: 'Agent Market', icon: 'chart' }, { href: '/cli', label: 'CLI & API', icon: 'code' }] },
  { label: 'More', items: [{ href: '/card', label: 'Card', icon: 'card' }, { href: '/company', label: 'Company', icon: 'building' }, { href: '/jobs', label: 'Jobs', icon: 'briefcase' }, { href: '/updates', label: 'Updates', icon: 'feed' }, { href: '/docs', label: 'Docs', icon: 'book' }] }
];

const TABS: NavItem[] = [NAV[0].items[0], NAV[0].items[1], NAV[0].items[2], NAV[2].items[0]];

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const p: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    up: <><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></>,
    down: <><path d="M12 5v14" /><path d="m18 13-6 6-6-6" /></>,
    plus: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
    credit: <><path d="M4 7h16M7 7v10M17 7v10M4 17h16M9 12h6" /></>,
    stocks: <><path d="M4 19V5h16v14H4z" /><path d="M8 16v-4M12 16V8M16 16v-6" /></>,
    spark: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" /><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" /></>,
    chart: <><path d="M4 19V10M10 19V5M16 19v-8M22 19H2" /></>,
    code: <><path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 4l-4 16" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h5" /></>,
    building: <><path d="M4 21V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v17" /><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5h8v2M3 12h18" /></>,
    feed: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h10M7 16h6" /></>,
    book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    out: <><path d="M15 12H3M11 8l4 4-4 4" /><path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5" /></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p[name]}</svg>;
}

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
}

function AccountPanel({ onNavigate }: { onNavigate?: () => void }) {
  const { logout, exportWallet } = usePrivy();
  const { exportWallet: exportSolana } = useExportSolanaWallet();
  const { email, evmAddress, solanaAddress } = useRobankAccount();
  const [signingOut, setSigningOut] = useState(false);
  const [exportError, setExportError] = useState('');
  const doExport = async (kind: 'evm' | 'sol') => {
    setExportError('');
    try {
      if (kind === 'evm') await exportWallet({ address: evmAddress });
      else await exportSolana({ address: solanaAddress });
    } catch {
      setExportError('Export is not available right now.');
    }
  };
  return (
    <div className="shell-account">
      <div className="shell-account-id"><span className="shell-avatar">{(email || 'R').slice(0, 1).toUpperCase()}</span><div><b>{email || 'ROBANK account'}</b><small>Self-custodial wallets</small></div></div>
      <div className="shell-wallet"><span>EVM</span><b className="ui-mono">{evmAddress ? short(evmAddress) : 'Preparing…'}</b>{evmAddress && <CopyButton value={evmAddress} label="Copy" compact />}</div>
      <div className="shell-wallet"><span>SOL</span><b className="ui-mono">{solanaAddress ? short(solanaAddress) : 'Preparing…'}</b>{solanaAddress && <CopyButton value={solanaAddress} label="Copy" compact />}</div>
      <details className="shell-export"><summary>Export wallet keys</summary>
        <p className="ui-muted" style={{ fontSize: 11 }}>Opens Privy&apos;s secure window. Never share an exported key with anyone.</p>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" className="ui-btn ghost sm" disabled={!evmAddress} onClick={() => void doExport('evm')}>EVM</button>
          <button type="button" className="ui-btn ghost sm" disabled={!solanaAddress} onClick={() => void doExport('sol')}>Solana</button>
        </div>
        {exportError && <p className="ui-hint bad">{exportError}</p>}
      </details>
      <button type="button" className="ui-btn ghost sm block" disabled={signingOut} onClick={async () => { setSigningOut(true); onNavigate?.(); await logout().catch(() => undefined); window.location.replace('/login'); }}>
        <Icon name="out" size={15} /> {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/dashboard';
  const { ready, authenticated } = usePrivy();
  const [menuOpen, setMenuOpen] = useState(false);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) window.location.replace('/login?next=' + encodeURIComponent(pathname));
  }, [ready, authenticated, pathname]);

  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setSlow(true), 12_000);
    return () => window.clearTimeout(timer);
  }, [ready]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (!ready || !authenticated) {
    return (
      <main className="shell-loading" aria-live="polite">
        <img src="/robank-mark.png" alt="" />
        <span>{!ready ? (slow ? 'Still connecting to your secure session…' : 'Loading ROBANK') : 'Redirecting to sign in…'}</span>
        {slow && !ready && <button type="button" className="ui-btn secondary sm" onClick={() => window.location.reload()}>Reload</button>}
      </main>
    );
  }

  return (
    <div className="shell">
      <aside className="shell-side" aria-label="Main navigation">
        <Link href="/dashboard" className="shell-brand"><img src="/robank-mark.png" alt="" /><span>ROBANK</span></Link>
        <nav className="shell-nav">
          {NAV.map((group) => (
            <div key={group.label} className="shell-group">
              <span className="shell-group-label">{group.label}</span>
              {group.items.map((item) => (
                <Link key={item.href} href={item.href as any} className={isActive(pathname, item.href) ? 'active' : ''} aria-current={isActive(pathname, item.href) ? 'page' : undefined}>
                  <Icon name={item.icon} /><span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <AccountPanel />
      </aside>

      <header className="shell-mobile-top">
        <Link href="/dashboard" className="shell-brand"><img src="/robank-mark.png" alt="" /><span>ROBANK</span></Link>
        <button type="button" className="shell-icon-btn" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Icon name="menu" /></button>
      </header>

      <main className="shell-main" id="main">{children}</main>

      <nav className="shell-tabs" aria-label="Quick navigation">
        {TABS.map((item) => (
          <Link key={item.href} href={item.href as any} className={isActive(pathname, item.href) ? 'active' : ''}><Icon name={item.icon} /><span>{item.label}</span></Link>
        ))}
        <button type="button" onClick={() => setMenuOpen(true)} className={menuOpen ? 'active' : ''}><Icon name="menu" /><span>More</span></button>
      </nav>

      {menuOpen && (
        <div className="ui-overlay shell-sheet-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setMenuOpen(false); }}>
          <div className="ui-modal shell-sheet" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="ui-panel-head"><span className="ui-kicker">Menu</span><button type="button" className="shell-icon-btn" aria-label="Close menu" onClick={() => setMenuOpen(false)}><Icon name="close" /></button></div>
            <nav className="shell-sheet-nav">
              {NAV.flatMap((g) => g.items).map((item) => (
                <Link key={item.href} href={item.href as any} className={isActive(pathname, item.href) ? 'active' : ''}><Icon name={item.icon} /><span>{item.label}</span></Link>
              ))}
            </nav>
            <AccountPanel onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
