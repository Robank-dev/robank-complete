'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import type { EIP1193Provider } from 'viem';
import { api } from '@/lib/api';
import { getPredictedSafeAddress } from '@/lib/safe';
import { SAFE_STORAGE_KEY } from '@/lib/constants';

export default function VaultCard() {
  const { address, connector } = useAccount();
  const [vault, setVault] = useState<string>();
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!address) return;
    const stored = window.localStorage.getItem(SAFE_STORAGE_KEY);
    if (stored) setVault(stored);
  }, [address]);

  async function prepareVault() {
    if (!address || !connector) return;
    setStatus('Preparing Safe vaultâ€¦');
    try {
      const provider = await connector.getProvider() as EIP1193Provider;
      const predicted = await getPredictedSafeAddress(provider, address);
      setVault(predicted);
      window.localStorage.setItem(SAFE_STORAGE_KEY, predicted);
      await api.registerUser(address).catch(() => undefined);
      setStatus('Vault ready (predicted). Deploy it from the Vault page when funded for gas.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not prepare vault');
    }
  }

  return (
    <div className="rounded-2xl border border-ro-line bg-ro-panel p-5 glow">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm text-white/50">Personal vault</div>
          <div className="mt-1 font-mono text-xs text-white/40">Safe smart account Â· Base Sepolia</div>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-wider text-white/50">non-custodial</span>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="text-xs uppercase tracking-[.16em] text-white/40">Vault address</div>
        <div className="mt-2 break-all font-mono text-sm text-white/85">
          {vault || 'No vault prepared yet'}
        </div>
      </div>
      {!vault && (
        <button onClick={prepareVault} className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90">
          Create Your Vault
        </button>
      )}
      {status && <p className="mt-3 text-xs text-white/55">{status}</p>}
    </div>
  );
}


