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
  const [destinationType, setDestinationType] = useState<'wallet' | 'bank'>('wallet');
  const [network, setNetwork] = useState<'base' | 'robinhood'>('base');
  const [to, setTo] = useState('');
  const [bankName, setBankName] = useState('');
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
    if (destinationType === 'wallet' && !isAddress(to)) return setStatus('Invalid wallet address.');
    if (destinationType === 'bank') return setStatus('Bank payout rail is not connected yet. Your beneficiary details are not sent anywhere.');
    if (!amount || Number(amount) <= 0) return setStatus('Enter a valid amount.');

    setStatus('Preparing…');
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
    <div className="send-workspace">
      <div className="send-destination-tabs">
        <button type="button" onClick={() => setDestinationType('wallet')} className={destinationType === 'wallet' ? 'active' : ''}><b>Wallet</b><span>Onchain address</span></button>
        <button type="button" onClick={() => setDestinationType('bank')} className={destinationType === 'bank' ? 'active' : ''}><b>Bank</b><span>Beneficiary account</span></button>
      </div>
      <div className="send-form-grid">
        {destinationType === 'wallet' ? <>
          <label>NETWORK<select value={network} onChange={(e) => setNetwork(e.target.value as 'base' | 'robinhood')}><option value="base">Base · USDC</option><option value="robinhood">Robinhood Chain · USDG</option></select></label>
          <label className="send-full">WALLET ADDRESS<input value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x…" /></label>
        </> : <>
          <label>BANK / BENEFICIARY<input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Recipient or bank name" /></label>
          <label>ACCOUNT / ADDRESS<input value={to} onChange={(e) => setTo(e.target.value)} placeholder="Account, IBAN or beneficiary address" /></label>
        </>}
        <label>ASSET<input value={destinationType === 'wallet' ? (network === 'base' ? 'USDC · Base' : 'USDG · Robinhood Chain') : 'Supported bank payout asset'} readOnly /></label>
        <label>AMOUNT<input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" /></label>
        <button onClick={submit} className="send-submit">{destinationType === 'wallet' ? 'Review transfer' : 'Review bank transfer'}</button>
      </div>
      {status && <p className="mt-3 break-all text-xs text-white/55">{status}</p>}
    </div>
  );
}

