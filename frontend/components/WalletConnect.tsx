'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { useSetActiveWallet } from '@privy-io/wagmi';

function short(value?: string) {
  return value ? `${value.slice(0, 6)}…${value.slice(-4)}` : '';
}

export default function WalletConnect() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();

  const wallet = wallets.find((item) => item.walletClientType === 'privy');
  const email = user?.email?.address;

  useEffect(() => {
    if (authenticated && wallet) setActiveWallet(wallet).catch(() => undefined);
  }, [authenticated, wallet, setActiveWallet]);

  if (!ready) return <span className="text-sm text-white/40">Loading…</span>;
  if (!authenticated) {
    return (
      <button onClick={() => login()} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black">
        Sign in
      </button>
    );
  }

  if (!wallet) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <div className="text-xs text-white/75">{email ?? 'ROBANK user'}</div>
          <div className="text-[10px] text-white/35">Embedded wallet preparing…</div>
        </div>
        <span className="h-2 w-2 animate-pulse rounded-full bg-white/60" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <div className="text-xs text-white/75">{email ?? 'ROBANK user'}</div>
        <div className="text-[10px] text-white/35">{short(wallet.address)}</div>
      </div>
      <button onClick={() => logout()} className="rounded-xl border border-ro-line bg-white/5 px-4 py-2 text-sm hover:bg-white/10">
        Sign out
      </button>
    </div>
  );
}
