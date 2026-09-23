'use client';

import { useState } from 'react';
import { isAddress } from 'viem';
import { useAccount, useSendTransaction, useSwitchChain } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { api } from '@/lib/api';
import { BASE_MAINNET_CHAIN_ID, ROBINHOOD_CHAIN_ID } from '@/lib/constants';

export default function SendForm() {
  const { authenticated } = usePrivy();
  const { address, chainId } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const [network, setNetwork] = useState<'base' | 'robinhood'>('base');
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');

  async function submit() {
    if (!authenticated) return setStatus('Sign in with email first.');
    if (!address) return setStatus('Privy wallet is still loading. Try again in a moment.');
    const targetChainId = network === 'base' ? BASE_MAINNET_CHAIN_ID : ROBINHOOD_CHAIN_ID;
    const token = network === 'base' ? 'USDC' : 'USDG';
    if (chainId !== targetChainId) {
      try {
        await switchChainAsync({ chainId: targetChainId });
      } catch {
        return setStatus(`Switch your wallet to ${network === 'base' ? 'Base' : 'Robinhood Chain'}.`);
      }
    }
    if (!isAddress(to)) return setStatus('Invalid recipient address.');
    if (!amount || Number(amount) <= 0) return setStatus('Enter a valid amount.');

    setStatus('Preparingâ€¦');
    try {
      const idempotencyKey = crypto.randomUUID();
      const result = await api.paymentIntent({
        walletAddress: address,
        to,
        amount,
        token,
        network
      }, idempotencyKey);
      const hash = await sendTransactionAsync({
        to: result.transaction.to as `0x${string}`,
        data: result.transaction.data as `0x${string}`,
        value: BigInt(result.transaction.value || '0')
      });
      const confirmation = await api.paymentConfirm({
        walletAddress: address,
        destination: to,
        amount,
        txHash: hash,
        network,
        asset: token
      });
      setStatus(confirmation.verified ? `Confirmed: ${hash}` : `Submitted: ${hash} — awaiting reconciliation.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Transaction failed');
    }
  }

  return (
    <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
      <div className="text-sm text-white/50">Send {network === 'base' ? 'USDC on Base' : 'USDG on Robinhood Chain'}</div>
      <div className="mt-4 space-y-3">
        <select value={network} onChange={(e) => setNetwork(e.target.value as 'base' | 'robinhood')} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none">
          <option value="base">Base Mainnet · USDC</option>
          <option value="robinhood">Robinhood Chain Mainnet · USDG</option>
        </select>
        <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Recipient 0xâ€¦" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/30" />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" inputMode="decimal" className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-white/30" />
        <button onClick={submit} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90">
          Preview & Send
        </button>
      </div>
      {status && <p className="mt-3 break-all text-xs text-white/55">{status}</p>}
    </div>
  );
}

