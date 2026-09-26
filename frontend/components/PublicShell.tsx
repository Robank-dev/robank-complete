'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const [open, setOpen] = useState(false);
  const app = ready && authenticated ? '/dashboard' : '/login';
  return (
    <div className="pub">
      <header className="pub-nav">
        <Link href="/" className="shell-brand"><img src="/robank-mark.png" alt="" /><span>ROBANK</span></Link>
        <nav className={open ? 'open' : ''} aria-label="Site">
          <Link href="/how-it-works">How it works</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/docs#cli">CLI & API</Link>
          <a href="https://github.com/Robank-dev/robank-complete" target="_blank" rel="noreferrer">GitHub</a>
        </nav>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href={app} className="ui-btn primary sm">{ready && authenticated ? 'Open app' : 'Sign in'}</Link>
          <button type="button" className="shell-icon-btn pub-menu" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? '✕' : '☰'}</button>
        </div>
      </header>
      <main className="pub-main">{children}</main>
      <footer className="pub-foot">
        <span>© {new Date().getFullYear()} ROBANK · Self-custodial software, not a bank.</span>
        <span><a href="mailto:contact@robank.co">contact@robank.co</a> · <a href="https://x.com/robankdev" target="_blank" rel="noreferrer">X</a></span>
      </footer>
    </div>
  );
}
