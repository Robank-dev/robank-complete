'use client';

import { useState } from 'react';
import { encodeFunctionData } from 'viem';
import { NATIVE_LOGOS, ROBINHOOD, STABLE_META, USDG, explorerTx, parseAmount } from '@/lib/chains';
import { friendlyError } from '@/lib/errors';
import { amount as fmtAmount, short } from '@/lib/format';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { TxCancelled, sendTx, waitTx } from '@/lib/tx';
import { Alert, Badge, Spinner, TokenIcon } from './ui';

const ERC20_TRANSFER = [{ type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }] as const;

type Stage = 'ready' | 'working' | 'submitted' | 'done' | 'failed' | 'cancelled';

/** A transfer prepared by the agent: check it, then Send (ROBANK's confirm sheet) or Cancel — right in the chat. */
export default function TransferCard({ asset, amount, to }: { asset: string; amount: string; to: string }) {
  const account = useRobankAccount();
  const portfolio = usePortfolio(account.user?.id || '');
  const [stage, setStage] = useState<Stage>('ready');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [hash, setHash] = useState('');

  const native = asset === 'ETH';
  const decimals = native ? ROBINHOOD.native.decimals : USDG.decimals;
  const units = parseAmount(amount, decimals);
  const held = portfolio.data?.holdings.find((h) => native ? h.kind === 'native' : h.kind === 'stablecoin' && h.symbol === asset);
  const short_ = units != null && held != null && BigInt(held.raw) < units;

  async function send() {
    if (!units || !account.evmWallet) return;
    setError(''); setStage('working');
    try {
      const tx = native
        ? { to: to as `0x${string}`, value: units }
        : { to: USDG.address as `0x${string}`, data: encodeFunctionData({ abi: ERC20_TRANSFER, functionName: 'transfer', args: [to as `0x${string}`, units] }) };
      const h = await sendTx(account.evmWallet, tx, {
        title: `Send ${asset}`,
        rows: [{ label: 'You send', value: `${fmtAmount(amount)} ${asset}` }, { label: 'To', value: short(to, 10, 8), mono: true }],
        note: 'Blockchain transfers cannot be reversed. Make sure the recipient can receive on Robinhood Chain.',
        action: 'Send'
      }, setProgress);
      setHash(h); setStage('submitted'); setProgress('Sent. Waiting for confirmation…');
      setStage((await waitTx(h)) ? 'done' : 'failed');
      void portfolio.refresh();
    } catch (e) {
      if (e instanceof TxCancelled) { setStage('ready'); return; }
      setError(friendlyError(e)); setStage((s) => (s === 'submitted' ? 'failed' : 'ready'));
    }
  }

  const badge = stage === 'done' ? <Badge tone="ok">Sent</Badge> : stage === 'cancelled' ? <Badge tone="off">Cancelled</Badge> : stage === 'failed' ? <Badge tone="bad">Failed</Badge> : <Badge tone="pending">Not sent</Badge>;

  return (
    <article className="mk-card swap">
      <div className="mk-head">
        <TokenIcon src={native ? NATIVE_LOGOS.ETH : STABLE_META.USDG.logo} label={asset} size={40} />
        <div className="mk-title"><b>Send {fmtAmount(amount)} {asset}</b><span>Robinhood Chain</span></div>
        {badge}
      </div>
      <div className="ui-kv">
        <div><span>To</span><b className="ui-mono">{short(to, 10, 8)}</b></div>
        <div><span>Available</span><b>{held ? `${fmtAmount(held.quantity, 6)} ${asset}` : portfolio.loading ? '…' : `0 ${asset}`}</b></div>
        <div><span>Network fee</span><b>Paid in ETH, shown before you confirm</b></div>
      </div>
      {short_ && stage === 'ready' && <Alert tone="warn">You have less {asset} than this amount.</Alert>}
      {(stage === 'working' || stage === 'submitted') && <div className="ui-alert"><Spinner /> <span>{progress || 'Working…'}</span></div>}
      {error && <Alert tone="bad">{error}</Alert>}
      {stage === 'done' && <Alert tone="ok">Transfer confirmed. <a className="ui-link" href={explorerTx(ROBINHOOD.id, hash)} target="_blank" rel="noreferrer">View transaction ↗</a></Alert>}
      {stage === 'failed' && hash && <Alert tone="bad">The transfer failed on-chain. <a className="ui-link" href={explorerTx(ROBINHOOD.id, hash)} target="_blank" rel="noreferrer">View ↗</a></Alert>}
      {(stage === 'ready' || stage === 'working') && (
        <div className="mk-actions">
          <button type="button" className="ui-btn primary sm" disabled={stage === 'working' || !units || short_} onClick={() => void send()}>{stage === 'working' ? <><Spinner /> Working…</> : 'Send'}</button>
          <button type="button" className="ui-btn ghost sm" disabled={stage === 'working'} onClick={() => setStage('cancelled')}>Cancel</button>
        </div>
      )}
    </article>
  );
}
