'use client';

import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { api } from '@/lib/api';

export default function OnrampWidget() {
  const { authenticated } = usePrivy();
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  async function start() {
    if (!authenticated) return setStatus('Sign in with email first.');
    if (!address) return setStatus('Privy wallet is still loading. Try again in a moment.');
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
      <div className="money-funding-options">
        <div><span>BANK FUNDING</span><b>Top up with your bank</b><small>Continue through the configured funding provider. Available payment methods are shown by the provider.</small></div>
        <div><span>CRYPTO FUNDING</span><b>Top up with your crypto</b><small>Use a supported crypto deposit rail when the connected provider exposes one.</small></div>
      </div>
      <div className="mt-4 flex gap-2">
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" inputMode="decimal" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none" />
        <button onClick={start} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black">Continue</button>
      </div>
      {status && <p className="mt-3 text-xs text-white/55">{status}</p>}
    </div>
  );
}

