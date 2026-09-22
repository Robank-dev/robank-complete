'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { api } from '@/lib/api';

export default function OnrampWidget() {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  async function start() {
    if (!address) return setStatus('Connect your wallet first.');
    setStatus('Preparing on-rampâ€¦');
    try {
      const result = await api.onramp(address, amount || undefined);
      window.open(result.url, '_blank', 'noopener,noreferrer');
      setStatus('On-ramp opened in a new tab.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'On-ramp unavailable');
    }
  }

  return (
    <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
      <div className="text-sm text-white/50">Buy USDC</div>
      <div className="mt-4 flex gap-2">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="USD amount" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none" />
        <button onClick={start} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black">Buy</button>
      </div>
      {status && <p className="mt-3 text-xs text-white/55">{status}</p>}
    </div>
  );
}

