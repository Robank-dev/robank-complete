'use client';

import { useEffect, useRef } from 'react';
import { useEnsureEvmWallet, useRobankAccount } from '@/lib/hooks/useRobankAccount';
import { isQa } from '@/lib/qa';

export default function EnsureWallet() {
  const { ready, authenticated, walletsReady, evmAddress, user } = useRobankAccount();
  const { ensure } = useEnsureEvmWallet();
  const tried = useRef('');

  useEffect(() => {
    if (isQa() || !ready || !authenticated || !walletsReady || evmAddress || !user?.id || tried.current === user.id) return;
    // Give Privy's own createOnLogin a moment to finish before stepping in.
    const t = setTimeout(() => { tried.current = user.id; ensure(); }, 3000);
    return () => clearTimeout(t);
  }, [ready, authenticated, walletsReady, evmAddress, user?.id, ensure]);

  return null;
}
