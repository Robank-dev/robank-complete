'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { encodeFunctionData } from 'viem';
import { NATIVE_LOGOS, ROBINHOOD, STABLE_META, USDG, explorerTx, formatUnits, isEvmAddress, parseAmount } from '@/lib/chains';
import { friendlyError } from '@/lib/errors';
import { amount as fmtAmount, short, usd } from '@/lib/format';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { TxCancelled, sendTx, waitTx } from '@/lib/tx';
import type { Holding } from '@/lib/server/portfolio';
import { Alert, Badge, Picker, Spinner, type PickerOption } from './ui';

type AssetKind = 'stable' | 'native' | 'token';
type AssetChoice = { id: string; kind: AssetKind; symbol: string; name: string; logo: string; decimals: number; contract: string | null; holding?: Holding };
type Phase = 'form' | 'signing' | 'submitted' | 'confirmed' | 'failed' | 'unknown';

const ERC20_TRANSFER = [{ type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }] as const;
const SOURCE_ID = `evm:${ROBINHOOD.id}`;

export default function SendForm() {
  const params = useSearchParams();
  const account = useRobankAccount();
  const portfolio = usePortfolio(account.user?.id || '');

  const [assetId, setAssetId] = useState('stable:USDG');
  const [recipient, setRecipient] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [progress, setProgress] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const prefilled = useRef(false);

  const holdings = portfolio.data?.holdings || [];
  const sources = portfolio.data?.sources || [];

  const assets = useMemo<AssetChoice[]>(() => {
    const list: AssetChoice[] = [
      { id: 'stable:USDG', kind: 'stable', symbol: USDG.symbol, name: STABLE_META.USDG.name, logo: STABLE_META.USDG.logo, decimals: USDG.decimals, contract: USDG.address },
      { id: 'native:ETH', kind: 'native', symbol: 'ETH', name: 'Ether', logo: NATIVE_LOGOS.ETH, decimals: ROBINHOOD.native.decimals, contract: null }
    ];
    for (const h of holdings) {
      if ((h.kind !== 'stock-token' && h.kind !== 'token') || !h.contract) continue;
      list.push({ id: `token:${h.contract}`, kind: 'token', symbol: h.symbol, name: h.name, logo: h.logo, decimals: h.decimals, contract: h.contract, holding: h });
    }
    return list;
  }, [holdings]);

  const asset = assets.find((a) => a.id === assetId) || assets[0];

  const balanceOf = (choice: AssetChoice): { raw: bigint; known: boolean } => {
    const ok = sources.some((s) => s.id === SOURCE_ID && s.ok);
    const match = holdings.find((h) => choice.kind === 'stable' ? h.kind === 'stablecoin' && h.symbol === choice.symbol
      : choice.kind === 'native' ? h.kind === 'native'
        : h.contract === choice.contract);
    return { raw: match ? BigInt(match.raw) : BigInt(0), known: Boolean(portfolio.data) && (ok || Boolean(match)) };
  };

  // Prefill from a link (e.g. prepared by the agent). Applied once; the user still reviews everything.
  useEffect(() => {
    if (prefilled.current || !params) return;
    const symbol = (params.get('asset') || '').toUpperCase();
    if (!symbol && !params.get('to')) { prefilled.current = true; return; }
    const match = assets.find((a) => a.symbol.toUpperCase() === symbol);
    if (symbol && !match && !portfolio.data && !portfolio.error) return; // wait for held tokens to load
    prefilled.current = true;
    if (match) setAssetId(match.id);
    const to = params.get('to');
    if (to && to.length <= 64) setRecipient(to.trim());
    const amt = params.get('amount');
    if (amt && /^\d+(\.\d+)?$/.test(amt)) setAmountInput(amt);
  }, [assets, params, portfolio.data, portfolio.error]);

  const decimals = asset.decimals;
  const units = parseAmount(amountInput, decimals);
  const balance = balanceOf(asset);
  const nativeBalance = holdings.find((h) => h.kind === 'native');
  const recipientTrim = recipient.trim();
  const recipientValid = isEvmAddress(recipientTrim);
  const sendingToSelf = recipientValid && recipientTrim.toLowerCase() === (account.evmAddress || '').toLowerCase();

  const issues: string[] = [];
  if (amountInput && !units) issues.push(`Enter a valid amount with at most ${decimals} decimals.`);
  if (units && balance.known && units > balance.raw) issues.push(`You only have ${fmtAmount(formatUnits(balance.raw, decimals))} ${asset.symbol}.`);
  if (recipientTrim && !recipientValid) issues.push('This is not a valid address. Robinhood Chain addresses start with 0x and have 42 characters.');
  if (sendingToSelf) issues.push('This is your own address.');
  const warnings: string[] = [];
  if (balance.known && asset.kind !== 'native' && portfolio.data && (!nativeBalance || BigInt(nativeBalance.raw) === BigInt(0))) {
    warnings.push(`You have no ETH on ${ROBINHOOD.label} to pay the network fee. The transfer will fail until you add some.`);
  }
  if (!balance.known && portfolio.data) warnings.push('Your balance could not be checked right now. Your wallet will still refuse a transfer you cannot afford.');
  if (asset.kind === 'native' && units && balance.known && units === balance.raw) warnings.push('Leave some ETH for the network fee.');

  const canReview = Boolean(account.authenticated && account.evmAddress && units && recipientValid && !issues.length);

  function reset() {
    setPhase('form'); setTxHash(null); setError(''); setProgress(''); setAmountInput('');
    lock.current = false;
  }

  async function execute() {
    if (lock.current || !units) return;
    lock.current = true;
    setError('');
    setPhase('signing');
    try {
      const wallet = account.evmWallet;
      if (!wallet) throw new Error('Your wallet is still loading. Try again in a moment.');
      const tx = asset.kind === 'native'
        ? { to: recipientTrim as `0x${string}`, value: units }
        : { to: asset.contract as `0x${string}`, data: encodeFunctionData({ abi: ERC20_TRANSFER, functionName: 'transfer', args: [recipientTrim as `0x${string}`, units] }) };
      const hash = await sendTx(wallet, tx, {
        title: `Send ${asset.symbol}`,
        rows: [{ label: 'You send', value: `${fmtAmount(amountInput)} ${asset.symbol}` }, { label: 'To', value: short(recipientTrim, 10, 8), mono: true }],
        note: 'Blockchain transfers cannot be reversed. Make sure the recipient can receive on Robinhood Chain.',
        action: 'Send'
      }, setProgress);
      setTxHash(hash);
      setPhase('submitted');
      setProgress(`Submitted. Waiting for confirmation on ${ROBINHOOD.label}…`);
      try {
        if (await waitTx(hash)) setPhase('confirmed');
        else { setPhase('failed'); setError('The transaction was included but failed on-chain. Your funds did not move (only the network fee was charged).'); }
      } catch {
        setPhase('unknown');
      }
      void portfolio.refresh();
    } catch (err) {
      console.error('[robank] send failed', err);
      if (err instanceof TxCancelled) { setPhase('form'); return; }
      setError(friendlyError(err));
      setPhase((current) => (current === 'submitted' ? 'unknown' : 'form'));
    } finally {
      lock.current = false;
    }
  }

  const assetOptions: PickerOption[] = assets.map((a) => {
    const b = balanceOf(a);
    const held = holdings.find((h) => a.kind === 'stable' ? h.kind === 'stablecoin' : a.kind === 'native' ? h.kind === 'native' : h.contract === a.contract);
    return { id: a.id, label: a.symbol, sub: a.name, image: a.logo, value: b.raw > BigInt(0) ? (held?.valueUsd != null ? usd(held.valueUsd) : `${fmtAmount(formatUnits(b.raw, a.decimals), 4)} ${a.symbol}`) : undefined };
  });

  const busy = phase === 'signing' || phase === 'submitted';
  const explorer = txHash ? explorerTx(ROBINHOOD.id, txHash) : '';

  if (phase !== 'form' && phase !== 'signing') {
    const title = phase === 'confirmed' ? 'Transfer confirmed'
      : phase === 'failed' ? 'Transfer not completed'
        : phase === 'unknown' ? 'Still pending'
          : phase === 'submitted' ? 'Transfer submitted' : 'Waiting for your approval';
    return (
      <section className="ui-panel" aria-live="polite">
        <div className="ui-panel-head">
          <div><span className="ui-kicker">SEND</span><h2>{title}</h2></div>
          <Badge tone={phase === 'confirmed' ? 'ok' : phase === 'failed' ? 'bad' : 'pending'}>{phase === 'confirmed' ? 'Confirmed' : phase === 'failed' ? 'Failed' : phase === 'unknown' ? 'Unconfirmed' : 'In progress'}</Badge>
        </div>
        <div className="ui-kv">
          <div><span>Amount</span><b>{fmtAmount(amountInput)} {asset.symbol}</b></div>
          <div><span>Network</span><b>{ROBINHOOD.label}</b></div>
          <div><span>To</span><b className="ui-mono">{short(recipientTrim, 8, 6)}</b></div>
          {txHash && <div><span>Transaction</span><b><a className="ui-link" href={explorer} target="_blank" rel="noreferrer">{short(txHash, 10, 8)} ↗</a></b></div>}
        </div>
        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {busy && <div className="ui-alert"><Spinner /> <span>{progress || 'Working…'} Keep this page open.</span></div>}
          {phase === 'confirmed' && <Alert tone="ok">The transfer is final on-chain.</Alert>}
          {phase === 'unknown' && <Alert tone="warn" title="We could not confirm the result yet.">{txHash ? 'Check the explorer link before trying again so you do not send twice.' : error || 'Check your wallet activity before trying again.'}</Alert>}
          {phase === 'failed' && <Alert tone="bad">{error || 'Nothing was sent.'}</Alert>}
          {!busy && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button type="button" className="ui-btn primary" onClick={reset}>New transfer</button><Link href="/dashboard" className="ui-btn ghost">Back to Overview</Link></div>}
        </div>
      </section>
    );
  }

  return (
    <section className="ui-panel">
      <div className="ui-grid two">
        <Picker label="Asset" value={assetOptions.find((o) => o.id === asset.id)} options={assetOptions} onChange={(o) => { setAssetId(o.id); setAmountInput(''); }} />
        <label className="ui-field">
          <span className="ui-label">Recipient address</span>
          <input className={`ui-input${recipientTrim && !recipientValid ? ' invalid' : ''}`} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="0x…" spellCheck={false} autoComplete="off" autoCapitalize="off" maxLength={64} />
        </label>
      </div>

      <label className="ui-field" style={{ marginTop: 14 }}>
        <span className="ui-label">Amount <em>{balance.known ? `Available: ${fmtAmount(formatUnits(balance.raw, decimals))} ${asset.symbol}` : portfolio.loading ? 'Checking balance…' : ''}</em></span>
        <div className="ui-input-wrap">
          <input className={`ui-input${amountInput && !units ? ' invalid' : ''}`} value={amountInput} onChange={(e) => setAmountInput(e.target.value.replace(',', '.').replace(/[^0-9.]/g, '').slice(0, 32))} placeholder="0.00" inputMode="decimal" autoComplete="off" />
          <span className="ui-input-suffix">
            {asset.kind !== 'native' && balance.raw > BigInt(0) && <button type="button" className="ui-btn ghost sm" onClick={() => setAmountInput(formatUnits(balance.raw, decimals))}>Max</button>}
            <span className="ui-muted" style={{ fontSize: 12 }}>{asset.symbol}</span>
          </span>
        </div>
      </label>

      <div className="ui-kv" style={{ marginTop: 14 }}>
        <div><span>Network</span><b style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><img src={ROBINHOOD.icon} alt="" width={14} height={14} />{ROBINHOOD.label}</b></div>
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        {error && phase === 'form' && <Alert tone="bad">{error}</Alert>}
        {issues.map((issue) => <p key={issue} className="ui-hint bad">{issue}</p>)}
        {warnings.map((w) => <p key={w} className="ui-hint warn">{w}</p>)}
        {!account.evmAddress && <Alert tone="warn">Your wallet is still being prepared. This usually takes a few seconds after sign-in.</Alert>}
        <button type="button" className="ui-btn primary block" disabled={!canReview || phase === 'signing'} onClick={() => void execute()}>{phase === 'signing' ? <><Spinner /> {progress || 'Working…'}</> : 'Send'}</button>
        <p className="ui-muted" style={{ textAlign: 'center' }}>Transfers go to addresses on {ROBINHOOD.label} only. To withdraw to an exchange, use its Robinhood Chain deposit address.</p>
      </div>
    </section>
  );
}
