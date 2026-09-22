'use client';

import { useState } from 'react';
import { parseUnits, isAddress } from 'viem';
import { useConnection, useSendTransaction } from 'wagmi';
import { api } from '@/lib/api';

export default function SendForm() {
  const { address } = useConnection();
  const { sendTransactionAsync } = useSendTransaction();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  async function submit() {
    if (!address) return setStatus('Connect your wallet first.');
    if (!isAddress(to)) return setStatus('Invalid recipient address.');
    if (!amount || Number(amount) <= 0) return setStatus('Enter a valid amount.');

    setStatus('Preparing…');
    try {
      const result = await api.routePayment({ from: address, to, amount, token: 'USDC' });
      const hash = await sendTransactionAsync({
        to: result.to as `0x${string}`,
        data: result.data as `0x${string}`,
        value: BigInt(result.value || '0')
      });
      setStatus(`Submitted: ${hash}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Transaction failed');
    }
  }

  return (
    <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
      <div className="text-sm text-white/50">Send USDC</div>
      <div className="mt-4 space-y-3">
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient 0x…" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/30" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" inputMode="decimal" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/30" />
        <button onClick={submit} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90">
          Preview & Send
        </button>
      </div>
      {status && <p className="mt-3 break-all text-xs text-white/55">{status}</p>}
    </div>
  );
}
