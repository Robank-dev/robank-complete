'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLoginWithEmail, usePrivy } from '@privy-io/react-auth';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';
import { short } from '@/lib/format';
import { Alert, Spinner } from './ui';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function safeNext() {
  if (typeof window === 'undefined') return '/dashboard';
  const next = new URLSearchParams(window.location.search).get('next') || '';
  // Only same-site paths: blocks open redirects like //evil.com or https://evil.com.
  return /^\/(?![\/\\])[\w\-./?=&%#]*$/.test(next) && !next.startsWith('/login') ? next : '/dashboard';
}

function friendly(message?: string) {
  const m = (message || '').toLowerCase();
  if (/invalid|incorrect|wrong/.test(m) && /code/.test(m)) return 'That code is not correct. Check the latest email and try again.';
  if (/expired/.test(m)) return 'That code has expired. Request a new one.';
  if (/too many|rate/.test(m)) return 'Too many attempts. Wait a minute and try again.';
  if (/network|fetch/.test(m)) return 'Network unavailable. Check your connection.';
  return message ? 'Sign-in failed. Please try again.' : '';
}

export default function PrivyLogin() {
  const { ready, authenticated } = usePrivy();
  const { evmAddress, solanaAddress } = useRobankAccount();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'wallets'>('email');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [slow, setSlow] = useState(false);
  const { sendCode, loginWithCode, state } = useLoginWithEmail({ onComplete: () => setStep('wallets'), onError: (e) => setError(friendly(String(e)) || 'Sign-in failed.') });

  // Already signed in (returning visitor): go straight to the app.
  useEffect(() => { if (ready && authenticated && step !== 'wallets') window.location.replace(safeNext()); }, [ready, authenticated, step]);

  useEffect(() => {
    if (step !== 'wallets') return;
    if (evmAddress && solanaAddress) {
      const t = window.setTimeout(() => window.location.replace(safeNext()), 700);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setSlow(true), 20_000);
    return () => window.clearTimeout(t);
  }, [step, evmAddress, solanaAddress]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function requestCode(event?: FormEvent) {
    event?.preventDefault();
    const value = email.trim().toLowerCase();
    if (!EMAIL.test(value)) { setError('Enter a valid email address.'); return; }
    if (cooldown > 0 || state.status === 'sending-code') return;
    setError('');
    try {
      await sendCode({ email: value });
      setEmail(value);
      setStep('code');
      setCode('');
      setCooldown(30);
    } catch (e) {
      setError(friendly(e instanceof Error ? e.message : String(e)) || 'The code could not be sent. Try again.');
    }
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (code.length !== 6 || state.status === 'submitting-code') return;
    setError('');
    try {
      await loginWithCode({ code });
    } catch (e) {
      setError(friendly(e instanceof Error ? e.message : String(e)) || 'Verification failed.');
    }
  }

  const sending = state.status === 'sending-code';
  const verifying = state.status === 'submitting-code';

  return (
    <main className="login">
      <Link href="/" className="shell-brand login-brand"><img src="/robank-mark.png" alt="" /><span>ROBANK</span></Link>
      <section className="ui-panel login-card" aria-live="polite">
        {step === 'wallets' ? (
          <div className="ui-grid" style={{ gap: 14 }}>
            <span className="ui-kicker">Almost there</span>
            <h1>Preparing your wallets</h1>
            <div className="ui-rows">
              <div className="ui-row"><span className="ui-token"><img src="/token-icons/ethereum.png" alt="" /></span><div className="ui-row-main"><b>EVM wallet</b><span className="ui-mono">{evmAddress ? short(evmAddress) : 'Creating…'}</span></div>{evmAddress ? '✓' : <Spinner />}</div>
              <div className="ui-row"><span className="ui-token"><img src="/chain-icons/solana.svg" alt="" /></span><div className="ui-row-main"><b>Solana wallet</b><span className="ui-mono">{solanaAddress ? short(solanaAddress) : 'Creating…'}</span></div>{solanaAddress ? '✓' : <Spinner />}</div>
            </div>
            {slow && <Alert tone="warn" action={<button type="button" className="ui-btn secondary sm" onClick={() => window.location.replace(safeNext())}>Continue</button>}>This is taking longer than usual. You can continue — the app will finish setting up your wallets.</Alert>}
          </div>
        ) : step === 'email' ? (
          <form className="ui-grid" style={{ gap: 14 }} onSubmit={requestCode} noValidate>
            <span className="ui-kicker">Sign in or create an account</span>
            <h1>Welcome to ROBANK</h1>
            <p className="ui-muted">Use your email. We&apos;ll send a six-digit code — no password, no browser wallet needed.</p>
            <label className="ui-field"><span className="ui-label">Email</span>
              <input className="ui-input" type="email" autoComplete="email" autoFocus value={email} maxLength={254} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={!ready || sending} />
            </label>
            <button type="submit" className="ui-btn primary block" disabled={!ready || sending || !email.trim()}>{!ready ? <><Spinner /> Loading…</> : sending ? <><Spinner /> Sending code…</> : 'Continue'}</button>
          </form>
        ) : (
          <form className="ui-grid" style={{ gap: 14 }} onSubmit={verify}>
            <span className="ui-kicker">Check your inbox</span>
            <h1>Enter your code</h1>
            <p className="ui-muted">We sent a six-digit code to <b style={{ color: 'var(--ui-ink)' }}>{email}</b>.</p>
            <label className="ui-field"><span className="ui-label">Verification code</span>
              <input className="ui-input login-code" inputMode="numeric" autoComplete="one-time-code" autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="••••••" disabled={verifying} aria-label="Six-digit code" />
            </label>
            <button type="submit" className="ui-btn primary block" disabled={verifying || code.length !== 6}>{verifying ? <><Spinner /> Verifying…</> : 'Verify & continue'}</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <button type="button" className="ui-link" onClick={() => { setStep('email'); setError(''); }}>Use another email</button>
              <button type="button" className="ui-link" disabled={cooldown > 0 || sending} onClick={() => void requestCode()}>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}</button>
            </div>
          </form>
        )}
        {error && <div style={{ marginTop: 14 }}><Alert tone="bad">{error}</Alert></div>}
      </section>
      <p className="ui-muted login-foot">By continuing you create self-custodial wallets. ROBANK never sees your keys and cannot move your funds.</p>
    </main>
  );
}
