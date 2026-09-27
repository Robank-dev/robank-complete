'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AppShell from '@/components/AppShell';
import { Alert, Badge, Empty, Skeleton, Spinner } from '@/components/ui';
import { api, type CardState, type CashoutState } from '@/lib/api';
import { ROBINHOOD_CHAIN_ID, formatUnits } from '@/lib/chains';
import { friendlyError } from '@/lib/errors';
import { amount as fmtAmount, relativeTime, usd } from '@/lib/format';
import { sendStable } from '@/lib/evmTransfer';
import { TxCancelled } from '@/lib/tx';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';
import { usePortfolio } from '@/lib/hooks/usePortfolio';

const STATUS: Record<string, { label: string; tone: 'ok' | 'pending' | 'bad' | 'warn' }> = {
  SUCCESS: { label: 'Paid', tone: 'ok' }, PENDING: { label: 'Sending', tone: 'pending' }, PROCESSING: { label: 'Sending', tone: 'pending' },
  UNCLAIMED: { label: 'Waiting for PayPal', tone: 'warn' }, RETRY: { label: 'Needs retry', tone: 'warn' }, FAILED: { label: 'Failed', tone: 'bad' }, CANCELED: { label: 'Canceled', tone: 'bad' }
};

function money(value: number, currency: string) {
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value); } catch { return `${value.toFixed(2)} ${currency}`; }
}

function Cashout() {
  const account = useRobankAccount();
  const portfolio = usePortfolio(account.user?.id || '');
  const [state, setState] = useState<CashoutState | null>(null);
  const [card, setCard] = useState<CardState | null>(null);
  const [loadError, setLoadError] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [rate, setRate] = useState<number | null>(null);
  const [paypal, setPaypal] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad' | 'warn'; text: string } | null>(null);
  const pending = useRef('');

  const load = useCallback(() => {
    api.cashout().then(setState).catch((e) => setLoadError(friendlyError(e, 'Cash out could not be loaded.')));
    api.card().then(setCard).catch(() => undefined);
  }, []);
  useEffect(load, [load]);
  useEffect(() => {
    if (!state?.enabled) return;
    setRate(null);
    api.cashoutRate(currency).then((r) => setRate(r.rate)).catch(() => setRate(null));
  }, [currency, state?.enabled]);

  const usdg = portfolio.data?.holdings.find((h) => h.kind === 'stablecoin' && h.symbol === 'USDG' && h.chainId === ROBINHOOD_CHAIN_ID);
  const balance = usdg ? Number(formatUnits(BigInt(usdg.raw), 6)) : 0;
  const value = Number(amount) || 0;
  const fee = state ? Math.max(state.fees.minUsd, Math.ceil(value * state.fees.percent) / 100) : 0;
  const total = Math.round((value + fee) * 100) / 100;
  const receives = rate != null ? Math.floor(value * 100 * (currency === 'USD' ? Math.min(1, rate) : rate)) / 100 : null;

  /** The same identity check as the Card page — one verification unlocks both. */
  async function startKyc() {
    setMessage(null);
    const tab = card?.kycUrl ? null : window.open('', '_blank');
    try {
      const url = card?.kycUrl || (await api.cardAction({ action: 'verify' })).url;
      if (tab) { tab.opener = null; tab.location.href = url; } else if (!window.open(url, '_blank')) window.location.href = url;
      load();
    } catch (e) { tab?.close(); setMessage({ tone: 'bad', text: friendlyError(e, 'Verification could not start.') }); }
  }

  async function submit() {
    if (!state?.payment.address || !account.evmWallet) return;
    const problem = !value || value < state.fees.minUsdAmount || value > state.fees.maxUsdAmount ? `Cash out between ${usd(state.fees.minUsdAmount)} and ${usd(state.fees.maxUsdAmount)}.`
      : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(paypal.trim()) ? 'Enter the email address of your PayPal account.'
        : !firstName.trim() || !lastName.trim() ? 'Enter your name exactly as it appears on your PayPal account.'
          : portfolio.data && total > balance ? `You need ${usd(total)} USDG. You have ${fmtAmount(String(balance), 2)} USDG.` : '';
    if (problem) { setMessage({ tone: 'bad', text: problem }); return; }
    setBusy(true); setMessage(null);
    try {
      let hash = pending.current;
      if (!hash) {
        hash = await sendStable({
          wallet: account.evmWallet, chainId: ROBINHOOD_CHAIN_ID, asset: 'USDG', to: state.payment.address, units: BigInt(Math.round(total * 100)) * BigInt(10_000),
          onStatus: setProgress, onHash: (h) => { pending.current = h; setProgress('Payment sent. Waiting for confirmation…'); },
          review: { title: 'Cash out to PayPal', rows: [
            { label: 'PayPal', value: paypal.trim() },
            { label: 'Cash out', value: usd(value) },
            { label: 'ROBANK fee', value: usd(fee) },
            { label: 'You pay', value: `${usd(total)} USDG` },
            ...(receives != null ? [{ label: 'They receive', value: `≈ ${money(receives, currency)}` }] : [])
          ], note: 'The name must match the PayPal account, or PayPal returns the payout.', action: `Pay ${usd(total)}` }
        });
      }
      setProgress('Payment confirmed. Sending to PayPal…');
      await api.createCashout({ currency, usd: value, paypal: paypal.trim(), firstName: firstName.trim(), lastName: lastName.trim(), txHash: hash });
      pending.current = '';
      setAmount('');
      setMessage({ tone: 'ok', text: 'Your cash out is on its way to PayPal. It usually arrives within minutes.' });
      load(); void portfolio.refresh();
    } catch (e) {
      if (e instanceof TxCancelled) { setMessage(null); return; }
      setMessage({ tone: pending.current ? 'warn' : 'bad', text: pending.current ? `${friendlyError(e)} Your payment is saved — press Cash out again to finish without paying twice.` : friendlyError(e) });
    } finally { setBusy(false); setProgress(''); }
  }

  if (loadError) return <Alert tone="bad" action={<button className="ui-btn secondary sm" onClick={load}>Retry</button>}>{loadError}</Alert>;
  if (!state) return <Skeleton h={320} />;

  const verified = state.kycApproved;
  const stage = card?.stage;

  return (
    <div className="ui-grid aside">
      <section className="ui-panel">
        {!verified ? (
          <div className="ui-grid" style={{ gap: 14 }}>
            <div><span className="ui-kicker">Step 1</span><h2>Verify your identity</h2><p className="ui-muted">A one-time ID and selfie check by Didit — about two minutes. The same check is used for the ROBANK Card.</p></div>
            {stage === 'kyc-pending'
              ? <Alert tone="info" action={<button type="button" className="ui-btn ghost sm" onClick={load}>Check status</button>}>Your verification is in progress. Finish it in the verification tab.</Alert>
              : stage === 'kyc-rejected' ? <Alert tone="bad">Your last verification was not approved. You can try again with a valid ID.</Alert> : null}
            <button type="button" className="ui-btn primary" onClick={() => void startKyc()}>{stage === 'kyc-pending' ? 'Continue verification' : stage === 'kyc-rejected' ? 'Try again' : 'Verify identity'}</button>
            {message && <Alert tone={message.tone}>{message.text}</Alert>}
          </div>
        ) : (
          <div className="ui-grid" style={{ gap: 14 }}>
            <div className="ui-grid two">
              <label className="ui-field"><span className="ui-label">Amount (USD) <em>Available: {fmtAmount(String(balance), 2)} USDG</em></span>
                <input className="ui-input" value={amount} inputMode="decimal" placeholder="0.00" onChange={(e) => setAmount(e.target.value.replace(',', '.').replace(/[^0-9.]/g, '').slice(0, 12))} /></label>
              <label className="ui-field"><span className="ui-label">They receive in</span>
                <select className="ui-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>{state.currencies.map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
            </div>
            <label className="ui-field"><span className="ui-label">PayPal email</span><input className="ui-input" type="email" value={paypal} maxLength={160} placeholder="you@example.com" onChange={(e) => setPaypal(e.target.value)} /></label>
            <div className="ui-grid two">
              <label className="ui-field"><span className="ui-label">First name</span><input className="ui-input" value={firstName} maxLength={60} onChange={(e) => setFirstName(e.target.value)} /></label>
              <label className="ui-field"><span className="ui-label">Last name</span><input className="ui-input" value={lastName} maxLength={60} onChange={(e) => setLastName(e.target.value)} /></label>
            </div>
            <div className="ui-kv">
              <div><span>ROBANK fee</span><b>{state.fees.percent}% · min {usd(state.fees.minUsd)}{value ? ` · ${usd(fee)}` : ''}</b></div>
              <div><span>You pay</span><b>{value ? `${usd(total)} USDG` : '—'}</b></div>
              <div><span>They receive</span><b>{value && receives != null ? `≈ ${money(receives, currency)}` : rate == null && value ? <Spinner /> : '—'}</b></div>
            </div>
            {message && <Alert tone={message.tone}>{message.text}</Alert>}
            <button type="button" className="ui-btn primary block" disabled={busy || !state.enabled} onClick={() => void submit()}>{busy ? <><Spinner /> {progress || 'Working…'}</> : 'Cash out'}</button>
          </div>
        )}
      </section>
      <section className="ui-panel">
        <div className="ui-panel-head"><div><span className="ui-kicker">History</span><h2>Cash outs</h2></div></div>
        {!state.cashouts.length ? <Empty title="No cash outs yet">Your PayPal cash outs appear here.</Empty> : (
          <div className="ui-rows">
            {state.cashouts.map((c) => {
              const s = STATUS[c.status] || { label: c.status, tone: 'pending' as const };
              return (
                <div className="ui-row" key={c.id}>
                  <div className="ui-row-main"><b>{usd(c.usd)} → {c.paypal}</b><span>{c.arrive != null ? `${money(c.arrive, c.currency)} · ` : ''}{relativeTime(c.at)}</span></div>
                  <div className="ui-row-end"><Badge tone={s.tone}>{s.label}</Badge></div>
                </div>
              );
            })}
          </div>
        )}
        <p className="ui-muted" style={{ fontSize: 12, marginTop: 12 }}>Sent through PayPal. If a payout fails or is not claimed, contact support and your USDG is returned.</p>
      </section>
    </div>
  );
}

export default function CashoutPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">Cash out</span><h1>Cash out to PayPal</h1><p>Turn your USDG into money in your PayPal account — in USD, EUR, GBP, AUD, CAD, JPY or MXN.</p></div></header>
        <Cashout />
      </div>
    </AppShell>
  );
}
