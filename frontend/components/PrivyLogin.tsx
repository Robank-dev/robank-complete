'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useLoginWithEmail, usePrivy, useWallets } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useSetActiveWallet } from '@privy-io/wagmi';

type BootStage = 'verify' | 'wallets' | 'ready' | 'error';

const MIN_BOOT_MS = 5000;
const MAX_BOOT_WAIT_MS = 30000;

function short(value?: string) {
  return value ? value.slice(0, 6) + '…' + value.slice(-4) : '';
}

export default function PrivyLogin() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [booting, setBooting] = useState(false);
  const [bootStage, setBootStage] = useState<BootStage>('verify');
  const [bootError, setBootError] = useState('');
  const [bootEvmAddress, setBootEvmAddress] = useState('');
  const [bootSolanaAddress, setBootSolanaAddress] = useState('');
  const [privyLoginComplete, setPrivyLoginComplete] = useState(false);

  const bootStartedAt = useRef(0);

  const evmWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');

  const handlePrivyLoginComplete = useCallback(
    ({
      user: completedUser
    }: {
      user: {
        linkedAccounts?: Array<{
          type?: string;
          walletClientType?: string;
          chainType?: string;
          address?: string;
        }>;
      };
    }) => {
      const linkedAccounts = Array.isArray(completedUser?.linkedAccounts)
        ? completedUser.linkedAccounts
        : [];

      const evm = linkedAccounts.find(
        (account) =>
          account.type === 'wallet' &&
          account.walletClientType === 'privy' &&
          account.chainType === 'ethereum' &&
          Boolean(account.address)
      );

      const solana = linkedAccounts.find(
        (account) =>
          account.type === 'wallet' &&
          account.walletClientType === 'privy' &&
          account.chainType === 'solana' &&
          Boolean(account.address)
      );

      setBootEvmAddress(evm?.address || '');
      setBootSolanaAddress(solana?.address || '');
      setPrivyLoginComplete(true);
    },
    []
  );

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onComplete: handlePrivyLoginComplete
  });

  useEffect(() => {
    if (!booting) return;

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [booting]);

  useEffect(() => {
    if (!booting) return;

    const timeout = window.setTimeout(() => {
      if (!privyLoginComplete) {
        setBootStage('error');
        setBootError(
          'Privy login completed, but the embedded wallet state did not finish syncing within 30 seconds.'
        );
      }
    }, MAX_BOOT_WAIT_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [booting, privyLoginComplete]);

  useEffect(() => {
    if (!booting || !privyLoginComplete) return;

    if (!bootEvmAddress || !bootSolanaAddress) {
      setBootStage('error');
      setBootError(
        'Privy finished login without returning both embedded wallet addresses.'
      );
      return;
    }

    setBootError('');
    setBootStage('ready');

    const remaining = Math.max(
      0,
      MIN_BOOT_MS - (Date.now() - bootStartedAt.current)
    );

    const timer = window.setTimeout(() => {
      if (evmWallet) {
        void setActiveWallet(evmWallet).catch(() => undefined);
      }

      setBooting(false);
      setPrivyLoginComplete(false);
      router.replace('/dashboard');
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [
    booting,
    privyLoginComplete,
    bootEvmAddress,
    bootSolanaAddress,
    evmWallet,
    setActiveWallet,
    router
  ]);

  useEffect(() => {
    if (ready && authenticated && !booting) {
      router.replace('/dashboard');
    }
  }, [ready, authenticated, booting, router]);

  if (authenticated && !booting) return null;

  const waitingForCode =
    otpSent &&
    (state.status === 'awaiting-code-input' ||
      state.status === 'submitting-code' ||
      state.status === 'error');

  const authError = state.status === 'error' ? state.error?.message : '';

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;

    await sendCode({
      email: email.trim(),
      disableSignup: false
    });

    setOtpSent(true);
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();

    if (!code.trim() || booting) return;

    setBootError('');
    setBootStage('verify');
    setBootEvmAddress('');
    setBootSolanaAddress('');
    setPrivyLoginComplete(false);
    bootStartedAt.current = Date.now();
    setBooting(true);

    try {
      await loginWithCode({
        code: code.trim()
      });
    } catch (cause) {
      setBooting(false);
      setBootStage('error');
      setBootError(
        cause instanceof Error ? cause.message : 'Verification failed.'
      );
    }
  };

  const retryBoot = () => {
    setBootError('');
    setBootStage('verify');
    setBootEvmAddress('');
    setBootSolanaAddress('');
    setPrivyLoginComplete(false);
    bootStartedAt.current = Date.now();
    setBooting(true);
  };

  if (booting) {
    const evmDone = Boolean(bootEvmAddress);
    const solDone = Boolean(bootSolanaAddress);

    const progress =
      bootStage === 'verify'
        ? 20
        : bootStage === 'wallets'
          ? evmDone
            ? 78
            : 45
          : bootStage === 'ready'
            ? 100
            : 78;

    return (
      <div
        className="ro-wallet-bootstrap"
        role="dialog"
        aria-modal="true"
        aria-live="polite"
      >
        <div className="ro-bootstrap-ambient ambient-a" />
        <div className="ro-bootstrap-ambient ambient-b" />

        <div className="ro-bootstrap-shell">
          <div className="ro-bootstrap-orbit orbit-one" />
          <div className="ro-bootstrap-orbit orbit-two" />

          <div className="ro-bootstrap-core">
            <div className="ro-bootstrap-ring" />
            <img src="/robank-mark.png" alt="" />
          </div>

          <div className="ro-bootstrap-brand">ROBANK</div>

          <h1>{bootStage === 'ready' ? 'Account ready' : 'Preparing your account'}</h1>

          <p className="ro-bootstrap-lead">
            {bootStage === 'error'
              ? 'Wallet synchronization needs attention before the app can open.'
              : 'Your ROBANK account and embedded wallets are being prepared securely.'}
          </p>

          <div className="ro-bootstrap-wallets">
            <div
              className={
                'ro-bootstrap-wallet ' +
                (evmDone ? 'done' : bootStage === 'wallets' ? 'active' : '')
              }
            >
              <span className="ro-bootstrap-wallet-icon">
                <img src="/token-icons/eth.svg" alt="Ethereum" />
              </span>

              <div>
                <b>Ethereum / EVM</b>
                <small>
                  {evmDone ? short(bootEvmAddress) : 'Waiting for Privy…'}
                </small>
              </div>

              <span className="ro-bootstrap-state">
                {evmDone ? 'OK' : '...'}
              </span>
            </div>

            <div
              className={
                'ro-bootstrap-wallet ' +
                (solDone ? 'done' : bootStage === 'wallets' ? 'active' : '')
              }
            >
              <span className="ro-bootstrap-wallet-icon sol">
                <img src="/token-icons/solana.svg" alt="Solana" />
              </span>

              <div>
                <b>Solana</b>
                <small>
                  {solDone ? short(bootSolanaAddress) : 'Waiting for Privy…'}
                </small>
              </div>

              <span className="ro-bootstrap-state">
                {solDone ? 'OK' : '...'}
              </span>
            </div>
          </div>

          <div className="ro-bootstrap-progress">
            <span style={{ width: progress + '%' }} />
          </div>

          <div className="ro-bootstrap-steps">
            <span className={evmDone ? 'done' : 'active'}>Account</span>
            <i>·</i>
            <span className={solDone ? 'done' : 'active'}>Wallets</span>
            <i>·</i>
            <span className={bootStage === 'ready' ? 'done' : ''}>Secure</span>
          </div>

          <div className="ro-bootstrap-status">
            <span className="ro-bootstrap-pulse" />

            {bootStage === 'verify' &&
              'Verifying your ROBANK session'}
            {bootStage === 'wallets' &&
              'Waiting for Privy to finish your embedded wallets'}
            {bootStage === 'ready' && 'Account ready'}
            {bootStage === 'error' &&
              'Wallet synchronization needs attention'}
          </div>

          {bootStage === 'error' && (
            <>
              <p className="ro-bootstrap-error">{bootError}</p>

              <button
                type="button"
                className="ro-bootstrap-retry"
                onClick={retryBoot}
              >
                Retry
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-ro-bg px-5 py-16 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
        <section className="w-full rounded-3xl border border-ro-line bg-white/[.03] p-7 shadow-2xl">
          <div className="mb-8">
            <div className="mb-4 text-xs font-semibold tracking-[.22em] text-white/45">
              ROBANK
            </div>

            <h1 className="text-3xl font-semibold tracking-tight">
              Sign in to ROBANK
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/55">
              Use your email. No browser wallet is required.
            </p>
          </div>

          {!waitingForCode ? (
            <form onSubmit={submitEmail} className="space-y-4">
              <label className="block text-xs font-medium text-white/55">
                EMAIL
              </label>

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
                {state.status === 'sending-code'
                  ? 'Sending code…'
                  : 'Continue with email →'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitCode} className="space-y-4">
              <div className="rounded-2xl border border-ro-line bg-black/20 px-4 py-3 text-sm text-white/60">
                Code sent to <b className="text-white">{email}</b>
              </div>

              <label className="block text-xs font-medium text-white/55">
                VERIFICATION CODE
              </label>

              <input
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="123456"
                className="w-full rounded-2xl border border-ro-line bg-black/30 px-4 py-3.5 text-center text-xl tracking-[.35em] outline-none placeholder:text-white/20 focus:border-white/30"
                disabled={state.status === 'submitting-code' || booting}
                required
              />

              <button
                type="submit"
                disabled={state.status === 'submitting-code' || booting}
                className="w-full rounded-2xl bg-white px-4 py-3.5 text-sm font-semibold text-black disabled:opacity-50"
              >
                {state.status === 'submitting-code'
                  ? 'Verifying…'
                  : 'Verify & open ROBANK →'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCode('');
                  setOtpSent(false);
                }}
                className="w-full py-2 text-xs text-white/45 hover:text-white/70"
                disabled={booting}
              >
                Use another email
              </button>
            </form>
          )}

          {authError && (
            <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">
              {authError}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
