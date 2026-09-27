'use client';

import { useCallback, useState } from 'react';
import { useCreateWallet, usePrivy, useUser, useWallets } from '@privy-io/react-auth';
import { QA_ACCOUNT, isQa } from '@/lib/qa';

type Linked = { type?: string; walletClientType?: string; chainType?: string; address?: string };

// Newer Privy apps create TEE-backed embedded wallets reported as 'privy-v2'.
const isEmbedded = (type?: string) => type === 'privy' || type === 'privy-v2';

/** The signed-in user's embedded Robinhood Chain (EVM) wallet. Linked-account data is authoritative; the wallet object is needed to sign. */
export function useRobankAccount() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const linked = (Array.isArray(user?.linkedAccounts) ? user!.linkedAccounts : []) as Linked[];
  const linkedAddress = linked.find((a) => a.type === 'wallet' && isEmbedded(a.walletClientType) && a.chainType === 'ethereum' && a.address)?.address || '';
  const embedded = wallets.filter((w) => isEmbedded(w.walletClientType));
  const evmWallet = embedded.find((w) => w.address.toLowerCase() === linkedAddress.toLowerCase()) || embedded[0];
  // A freshly created wallet can appear in `wallets` before the cached user object is refreshed.
  const evmAddress = linkedAddress || evmWallet?.address || '';
  if (isQa()) return { ready: true, authenticated: true, user: { id: 'qa-user' } as any, email: QA_ACCOUNT.email, evmAddress: QA_ACCOUNT.evmAddress, evmWallet, walletsReady: true };
  return {
    ready,
    authenticated,
    user,
    email: user?.email?.address || '',
    evmAddress,
    evmWallet,
    walletsReady
  };
}

let inflight: Promise<void> | null = null;

/** Creates the embedded EVM wallet when `createOnLogin` did not (failed request, or a session that predates it). */
export function useEnsureEvmWallet() {
  const { createWallet } = useCreateWallet();
  const { refreshUser } = useUser();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const ensure = useCallback(async () => {
    setError('');
    setPending(true);
    inflight ||= (async () => {
      try {
        await createWallet();
      } catch (e: any) {
        // Privy throws when a wallet already exists; the cached user object is just stale.
        if (!/already/i.test(String(e?.message || e))) throw e;
      } finally {
        await refreshUser().catch(() => undefined);
      }
    })().finally(() => { inflight = null; });
    try {
      await inflight;
    } catch (e: any) {
      setError(e?.message || 'Could not create your wallet.');
    } finally {
      setPending(false);
    }
  }, [createWallet, refreshUser]);

  return { ensure, error, pending };
}
