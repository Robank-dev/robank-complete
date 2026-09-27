'use client';

import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '@/app/landing.css';
import Link from 'next/link';
import TokenPill from './TokenPill';
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { LandingFx } from '@/components/LandingFx';
import Background3D from '@/components/Background3D';

export const X_PATH = 'M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z';
const GITHUB_PATH = 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12';
const TELEGRAM_PATH = 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z';

export const Icon = ({ d, size = 14 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true"><path d={d} /></svg>
);

export function useAppHref() {
  const { ready, authenticated } = usePrivy();
  const signedIn = ready && authenticated;
  const href: '/dashboard' | '/login' = signedIn ? '/dashboard' : '/login';
  return { href, signedIn };
}

/** Shared chrome for the public marketing pages: interaction layer, nav and footer. */
export default function SiteChrome({ children, active, bgAfterHero }: { children: React.ReactNode; active?: 'how' | 'docs'; bgAfterHero?: boolean }) {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { href, signedIn } = useAppHref();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = (
    <>
      <a href="/how-it-works" className={active === 'how' ? 'active' : ''}>How it works</a>
      <a href="/docs" className={active === 'docs' ? 'active' : ''}>Docs</a>
      <a href="/#card">Card</a>
      <a href="/#cashout">Cash out</a>
    </>
  );

  return (
    <main className="lp">
      <Background3D afterHero={bgAfterHero} dim={active === 'docs'} />
      <LandingFx />

      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''} ${menu ? 'open' : ''}`}>
        <Link href="/" className="lp-brand"><span className="lp-brand-mark"><img src="/robank-mark.png" alt="" /></span>ROBANK</Link>
        <div className="lp-nav-links">
          {links}
          <a href="https://x.com/robank_co" target="_blank" rel="noreferrer" aria-label="ROBANK on X"><Icon d={X_PATH} size={12} /></a>
        </div>
        <Link href={href} className="lp-btn lp-btn-light lp-btn-sm lp-nav-cta">{signedIn ? 'Open app' : 'Sign in'}</Link>
        <button className="lp-menu" onClick={() => setMenu((v) => !v)} aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu}><i /><i /></button>
        <div className="lp-sheet" onClick={() => setMenu(false)}>
          {links}
          <a href="https://x.com/robank_co" target="_blank" rel="noreferrer">X · @robank_co</a>
          <Link href={href} className="lp-btn lp-btn-light">{signedIn ? 'Open app' : 'Sign in with email'} <span>→</span></Link>
        </div>
      </nav>

      {children}

      <footer className="lp-footer">
        <div className="lp-footer-top">
          <div className="lp-footer-brand">
            <Link href="/" className="lp-brand"><span className="lp-brand-mark"><img src="/robank-mark.png" alt="" /></span>ROBANK</Link>
            <p>Self-custodial money on Robinhood Chain, with an AI agent that prepares and never signs.</p>
            <div className="lp-rh-badge"><img src="/chain-icons/robinhood.svg" alt="" />Built on Robinhood Chain</div>
            <TokenPill variant="foot" />
          </div>
          <div className="lp-footer-cols">
            <div><b>Product</b><a href="/#product">Overview</a><a href="/#card">ROBANK Card</a><a href="/#cashout">Cash out</a><a href="/docs#token">$ROBANK</a><a href="/#agent">AI agent</a></div>
            <div><b>Learn</b><a href="/how-it-works">How it works</a><a href="/docs">Docs</a><a href="/docs#cli">CLI</a><a href="/docs#api">API</a></div>
            <div><b>Company</b><a href="mailto:contact@robank.co">contact@robank.co</a><a href="https://x.com/robank_co" target="_blank" rel="noreferrer">X</a><a href="https://t.me/robank_tg" target="_blank" rel="noreferrer">Telegram</a><a href="https://github.com/Robank-dev/robank-complete" target="_blank" rel="noreferrer">GitHub</a></div>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <small>© {new Date().getFullYear()} ROBANK. Self-custodial software. Only your signature moves funds.</small>
          <div className="lp-footer-links">
            <a href="https://x.com/robank_co" target="_blank" rel="noreferrer" aria-label="X"><Icon d={X_PATH} /></a>
            <a href="https://t.me/robank_tg" target="_blank" rel="noreferrer" aria-label="Telegram"><Icon d={TELEGRAM_PATH} /></a>
            <a href="https://github.com/Robank-dev/robank-complete" target="_blank" rel="noreferrer" aria-label="GitHub"><Icon d={GITHUB_PATH} /></a>
          </div>
        </div>
      </footer>
    </main>
  );
}
