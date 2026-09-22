'use client';

import { useAccount } from 'wagmi';
import { SAFE_STORAGE_KEY } from '@/lib/constants';
import { useEffect, useState } from 'react';

export default function ReceiveCard() {
  const { address } = useAccount();
  const [vault, setVault] = useState('');

  useEffect(() => {
    setVault(window.localStorage.getItem(SAFE_STORAGE_KEY) || address || '');
  }, [address]);

  return (
    <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
      <div className="text-sm text-white/50">Receive</div>
      <div className="mt-4 rounded-xl border border-dashed border-white/15 p-6 text-center">
        <div className="mx-auto mb-4 grid h-28 w-28 place-items-center rounded-xl border border-white/10 bg-white/[.03] font-mono text-[10px] text-white/35">
          QR
        </div>
        <div className="break-all font-mono text-xs text-white/70">{vault || 'Connect wallet and create a vault'}</div>
      </div>
    </div>
  );
}

