'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useLoginWithEmail, usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { useRouter } from 'next/navigation';

export default function PrivyLogin() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onComplete: () => router.replace('/dashboard')
  });
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (!ready || !authenticated) return;
    const wallet = wallets.find((item) => item.walletClientType === 'privy');
    if (wallet) {
      setActiveWallet(wallet).catch(() => undefined);
      router.replace('/dashboard');
    }
  }, [ready, authenticated, wallets, setActiveWallet, router]);

  if (authenticated) return null;

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    await sendCode({ email: email.trim(), disableSignup: false });
    setOtpSent(true);
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;
    await loginWithCode({ code: code.trim() });
  };

  const waitingForCode = otpSent && (state.status === 'awaiting-code-input' || state.status === 'submitting-code' || state.status === 'error');
  const error = state.status === 'error' ? state.error?.message : null;

  return (
    <main className="min-h-screen bg-ro-bg px-5 py-16 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
        <section className="w-full rounded-3xl border border-ro-line bg-white/[.03] p-7 shadow-2xl">
          <div className="mb-8">
            <div className="mb-4 text-xs font-semibold tracking-[.22em] text-white/45">ROBANK</div>
            <h1 className="text-3xl font-semibold tracking-tight">Sign in to ROBANK</h1>
            <p className="mt-2 text-sm leading-6 text-white/55">Use your email. No browser wallet is required.</p>
          </div>

          {!waitingForCode ? (
            <form onSubmit={submitEmail} className="space-y-4">
              <label className="block text-xs font-medium text-white/55">EMAIL</label>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-ro-line bg-black/30 px-4 py-3.5 text-sm outline-none placeholder:text-white/25 focus:border-white/30"
                disabled={!ready || state.status === 'sending-code'}
                required
              />
              <button
                type="submit"
                disabled={!ready || state.status === 'sending-code'}
                className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm font-semibold text-black disabled:opacity-50"
              >
                {state.status === 'sending-code' ? 'Sending code…' : 'Continue with email →'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitCode} className="space-y-4">
              <div className="rounded-2xl border border-ro-line bg-black/20 px-4 py-3 text-sm text-white/60">
                Code sent to <b className="text-white">{email}</b>
              </div>
              <label className="block text-xs font-medium text-white/55">VERIFICATION CODE</label>
              <input
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full rounded-2xl border border-ro-line bg-black/30 px-4 py-3.5 text-center text-xl tracking-[.35em] outline-none placeholder:text-white/20 focus:border-white/30"
                disabled={state.status === 'submitting-code'}
                required
              />
              <button type="submit" disabled={state.status === 'submitting-code'} className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm font-semibold text-black disabled:opacity-50">
                {state.status === 'submitting-code' ? 'Verifying…' : 'Verify & open ROBANK →'}
              </button>
              <button type="button" onClick={() => { setCode(''); setOtpSent(false); }} className="w-full py-2 text-xs text-white/45 hover:text-white/70">
                Use another email
              </button>
            </form>
          )}

          {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">{error}</p>}

          {authenticated && wallets.find((item) => item.walletClientType === 'privy')?.address && <p className="mt-5 text-xs text-white/45">ROBANK wallet: {wallets.find((item) => item.walletClientType === 'privy')?.address}</p>}
        </section>
      </div>
    </main>
  );
}
