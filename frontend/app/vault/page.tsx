'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAccount, usePublicClient } from 'wagmi';
import type { EIP1193Provider } from 'viem';
import { getSafeDeploymentTransaction } from '@/lib/safe';
import { SAFE_STORAGE_KEY } from '@/lib/constants';

export default function VaultPage() {
  const { address, connector } = useAccount();
  const publicClient = usePublicClient();
  const [vault, setVault] = useState('');
  useEffect(() => {
    setVault(window.localStorage.getItem(SAFE_STORAGE_KEY) || '');
  }, []);
  const [status, setStatus] = useState('');

  async function deploy() {
    if (!address || !connector || !publicClient) return setStatus('Connect a wallet first.');
    setStatus('Building deployment transactionâ€¦');
    try {
      const provider = await connector.getProvider() as EIP1193Provider;
      const { safeAddress, deployment } = await getSafeDeploymentTransaction(provider, address);
      const hash = await (provider as any).request({
        method: 'eth_sendTransaction',
        params: [{
          from: address,
          to: deployment.to,
          data: deployment.data,
          value: `0x${BigInt(deployment.value).toString(16)}`
        }]
      });
      setStatus(`Submitted ${hash}`);
      await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });
      localStorage.setItem(SAFE_STORAGE_KEY, safeAddress);
      setVault(safeAddress);
      setStatus('Safe deployed successfully.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Deployment failed');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div><div className="text-xs uppercase tracking-[.2em] text-white/40">Vault</div><h2 className="mt-2 text-3xl font-semibold">Your Safe</h2></div>
        <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
          <div className="text-xs uppercase tracking-[.16em] text-white/40">Current vault</div>
          <div className="mt-3 break-all font-mono text-sm">{vault || 'No deployed vault yet'}</div>
          {!vault && <button onClick={deploy} className="mt-5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black">Deploy Safe</button>}
          <p className="mt-4 text-xs leading-5 text-white/45">Deployment requires Base Sepolia ETH for gas. ROBANK never receives your private key.</p>
          {status && <div className="mt-3 break-all text-xs text-white/60">{status}</div>}
        </div>
      </div>
    </AppShell>
  );
}







