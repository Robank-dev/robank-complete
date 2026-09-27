'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AppShell from '@/components/AppShell';
import { Alert, Badge, Empty, Modal, Skeleton, Spinner } from '@/components/ui';
import { api, type CardState } from '@/lib/api';
import { ROBINHOOD_CHAIN_ID, formatUnits, parseAmount } from '@/lib/chains';
import { friendlyError } from '@/lib/errors';
import { amount as fmtAmount, relativeTime, usd } from '@/lib/format';
import { sendStable } from '@/lib/evmTransfer';
import AccountSteps from '@/components/AccountSteps';
import CardApplication from '@/components/CardApplication';
import CardFace from '@/components/CardFace';
import { publishCardState, statusFromCard } from '@/lib/hooks/useAccountStatus';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';
import { usePortfolio } from '@/lib/hooks/usePortfolio';

/** What the user pays to load `credit` dollars onto the card (mirrors the server). */
function chargeFor(credit: number, fees: CardState['fees']) {
  const cents = Math.round(credit * 100);
  return (Math.ceil(cents * (100 + fees.loadPercent) / 100) + Math.round(fees.loadFlatUsd * 100)) / 100;
}

function Card() {
  const account = useRobankAccount();
  const portfolio = usePortfolio(account.user?.id || '');
  const [state, setState] = useState<CardState | null>(null);
  const [loadError, setLoadError] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad' | 'warn'; text: string } | null>(null);
  const [sensitive, setSensitive] = useState<{ cardNumber: string; cvv: string; expiryMonth: number; expiryYear: number } | null>(null);
  const pendingHash = useRef('');

  const load = useCallback(() => { api.card().then((s) => { setState(s); publishCardState(s); }).catch((e) => setLoadError(friendlyError(e, 'Your card could not be loaded.'))); }, []);
  useEffect(load, [load]);
  useEffect(() => { if (!sensitive) return; const t = window.setTimeout(() => setSensitive(null), 45_000); return () => window.clearTimeout(t); }, [sensitive]);

  const usdgHolding = portfolio.data?.holdings.find((h) => h.kind === 'stablecoin' && h.symbol === 'USDG' && h.chainId === ROBINHOOD_CHAIN_ID);
  const usdgBalance = usdgHolding ? Number(formatUnits(BigInt(usdgHolding.raw), 6)) : 0;

  /** Step 1: identity check with ROBANK's Didit. The same verification unlocks the card application and Cash out. */
  async function verify() {
    if (!state) return;
    setBusy('verify'); setMessage(null);
    // Open the tab synchronously so the browser does not block it as a popup.
    const tab = state.kycUrl ? null : window.open('', '_blank');
    try {
      const r = state.kycUrl ? { url: state.kycUrl } : await api.cardAction({ action: 'verify' });
      if (tab) { tab.opener = null; tab.location.href = r.url; } else if (!window.open(r.url, '_blank')) window.location.href = r.url;
      setMessage({ tone: 'ok', text: 'Verification opened in a new tab. Come back here when you are done — this page updates once you are approved.' });
      load();
    } catch (e) {
      tab?.close();
      setMessage({ tone: 'bad', text: friendlyError(e, 'Verification could not start.') });
    } finally { setBusy(''); }
  }

  async function act(action: 'reveal' | 'freeze' | 'unfreeze') {
    setBusy(action); setMessage(null);
    try {
      const r = await api.cardAction({ action });
      if (action === 'reveal') setSensitive(r.sensitive);
      else load();
    } catch (e) {
      setMessage({ tone: 'bad', text: friendlyError(e, 'That did not work. Please try again.') });
    } finally { setBusy(''); }
  }

  async function payAnd(action: 'issue' | 'fund') {
    if (!state?.payment.address || !account.evmWallet) return;
    const min = action === 'issue' ? state.payment.minIssueUsd : state.payment.minFundUsd;
    const credit = Number(amountInput);
    if (!parseAmount(amountInput, 2) || credit < min) { setMessage({ tone: 'bad', text: `Enter at least $${min}.` }); return; }
    const cardFee = action === 'issue' && !state.applicationPaid ? state.fees.applicationUsd : 0;
    const charge = Math.round((chargeFor(credit, state.fees) + cardFee) * 100) / 100;
    const units = BigInt(Math.round(charge * 100)) * BigInt(10_000);
    if (portfolio.data && charge > usdgBalance) { setMessage({ tone: 'bad', text: `Loading ${usd(credit)} costs ${usd(charge)} including fees. You have ${fmtAmount(String(usdgBalance), 2)} USDG.` }); return; }
    setBusy(action); setMessage(null);
    try {
      // Reuse a payment that already went through if the previous attempt failed after paying.
      let hash = pendingHash.current;
      if (!hash) {
        hash = await sendStable({ wallet: account.evmWallet, chainId: ROBINHOOD_CHAIN_ID, asset: 'USDG', to: state.payment.address, units, onStatus: setProgress, onHash: () => setProgress('Payment submitted. Waiting for confirmation…'),
          review: { title: action === 'issue' ? 'Issue your card' : 'Add money to your card', rows: [
            { label: 'Card receives', value: usd(credit) },
            ...(cardFee ? [{ label: 'Card fee, once', value: usd(cardFee) }] : []),
            { label: 'Loading fee', value: usd(charge - credit - cardFee) },
            { label: 'You pay', value: `${usd(charge)} USDG` }
          ], action: `Pay ${usd(charge)}` } });
        pendingHash.current = hash;
      }
      setProgress(action === 'issue' ? 'Payment confirmed. Issuing your card…' : 'Payment confirmed. Loading your card…');
      await api.cardAction({ action, txHash: hash });
      pendingHash.current = '';
      setAmountInput('');
      setMessage({ tone: 'ok', text: action === 'issue' ? 'Your card is being created. It is usually ready within a minute.' : `$${Number(amountInput).toFixed(2)} is being added to your card.` });
      load(); void portfolio.refresh();
    } catch (e) {
      setMessage({ tone: pendingHash.current ? 'warn' : 'bad', text: pendingHash.current ? `${friendlyError(e)} Your payment is saved — press the button again to retry without paying twice.` : friendlyError(e) });
    } finally { setBusy(''); setProgress(''); }
  }

  if (loadError) return <Alert tone="bad" action={<button className="ui-btn secondary sm" onClick={load}>Retry</button>}>{loadError}</Alert>;
  if (!state) return <Skeleton h={320} />;
  const card = state.card;
  const frozen = card?.status === 'DISABLE';

  const credit = Number(amountInput) || 0;
  const payBox = (action: 'issue' | 'fund', min: number, label: string) => {
    const cardFee = action === 'issue' && !state.applicationPaid ? state.fees.applicationUsd : 0;
    const charge = credit > 0 ? chargeFor(credit, state.fees) + cardFee : 0;
    return (
    <div className="ui-grid" style={{ gap: 10 }}>
      <label className="ui-field"><span className="ui-label">Amount to load<em>{portfolio.data ? `You have ${fmtAmount(String(usdgBalance), 2)} USDG` : ''}</em></span>
        <input className="ui-input" inputMode="decimal" placeholder={String(Math.max(min, 25))} value={amountInput} onChange={(e) => setAmountInput(e.target.value.replace(/[^0-9.]/g, '').slice(0, 10))} disabled={Boolean(busy)} />
      </label>
      <div className="ui-kv">
        <div><span>Card receives</span><b>{usd(credit)}</b></div>
        {cardFee > 0 && <div><span>Card fee, paid once</span><b>{usd(cardFee)}</b></div>}
        <div><span>Load fee ({state.fees.loadPercent}% + {usd(state.fees.loadFlatUsd)})</span><b>{usd(credit > 0 ? charge - credit - cardFee : 0)}</b></div>
        <div><span>You pay</span><b>{usd(charge)} USDG</b></div>
      </div>
      <p className="ui-muted" style={{ fontSize: 12 }}>Paid from your USDG balance on Robinhood Chain. A small network fee in ETH applies. Minimum load {usd(min)}.</p>
      <button type="button" className="ui-btn primary" disabled={Boolean(busy)} onClick={() => void payAnd(action)}>{busy === action ? <><Spinner /> {progress || 'Working…'}</> : label}</button>
    </div>
    );
  };

  return (
    <div className="card-layout">
      <section className="ui-panel card-stage-panel">
        <CardFace number={card?.cardNumber} name={card?.cardholderName} frozen={frozen} balance={card ? card.availableBalance : null} />
        {card && <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button type="button" className="ui-btn secondary sm" disabled={Boolean(busy)} onClick={() => void act('reveal')}>{busy === 'reveal' ? <Spinner /> : 'Show card details'}</button>
          <button type="button" className="ui-btn ghost sm" disabled={Boolean(busy)} onClick={() => void act(frozen ? 'unfreeze' : 'freeze')}>{busy === 'freeze' || busy === 'unfreeze' ? <Spinner /> : frozen ? 'Unfreeze' : 'Freeze'}</button>
        </div>}
      </section>

      <section className="ui-panel" style={{ alignSelf: 'start', display: 'grid', gap: 14 }}>
        <AccountSteps status={statusFromCard(state)} />
        {card ? (
          <>
            <div className="ui-panel-head" style={{ marginBottom: 0 }}><div><span className="ui-kicker">Your card</span><h2>{usd(card.availableBalance)} available</h2><p className="ui-muted">{card.brand} · {usd(card.totalConsumption)} spent</p></div><Badge tone={card.status === 'ENABLE' ? 'ok' : card.status === 'CREATING' ? 'pending' : 'warn'}>{card.status === 'ENABLE' ? 'Active' : card.status === 'CREATING' ? 'Creating' : card.status === 'DISABLE' ? 'Frozen' : card.status}</Badge></div>
            <span className="ui-kicker">Add funds</span>
            {payBox('fund', state.payment.minFundUsd, 'Add to card')}
          </>
        ) : state.stage === 'apply' ? (
          <CardApplication state={state} onSubmitted={() => { setMessage({ tone: 'ok', text: 'Application submitted. The card issuer usually reviews it within a day — this page updates automatically.' }); load(); }} />
        ) : state.stage === 'review' ? (
          <>
            <div><span className="ui-kicker">Step 2 of 3 · Application submitted</span><h2>Your card application is in review</h2><p className="ui-muted">The card issuer is reviewing your verified details. Once approved you can create your card here. Nothing has been charged.</p></div>
            <button type="button" className="ui-btn ghost" onClick={load}>Check status</button>
          </>
        ) : state.stage === 'review-rejected' ? (
          <Alert tone="bad" title="Card application not approved">The card issuer did not approve your application and no attempts are left. Contact support to review it.</Alert>
        ) : state.stage === 'ready-to-issue' ? (
          <>
            <div><span className="ui-kicker">Step 3 of 3 · Card approved</span><h2>Create your card</h2><p className="ui-muted">{state.applicationPaid ? 'Your card fee is already paid. Choose a starting balance.' : `Pay the one-time ${usd(state.fees.applicationUsd)} card fee and your starting balance in one payment.`}</p></div>
            {payBox('issue', state.payment.minIssueUsd, 'Pay & create card')}
          </>
        ) : state.stage === 'kyc-pending' ? (
          <>
            <div><span className="ui-kicker">Step 1 of 3</span><h2>Verification in progress</h2><p className="ui-muted">Finish the identity check in the verification tab. This page updates once it is approved.</p></div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button type="button" className="ui-btn primary" disabled={Boolean(busy)} onClick={() => void verify()}>Continue verification</button><button type="button" className="ui-btn ghost" onClick={load}>Check status</button></div>
          </>
        ) : (
          <>
            <div><span className="ui-kicker">ROBANK Card</span><h2>A virtual Visa card for your balance</h2><p className="ui-muted">Spend online anywhere Visa is accepted. Load it from your USDG balance and control it from here.</p></div>
            <ol className="card-steps">
              <li><b>Verify your identity</b><span>A two-minute ID and selfie check by Didit. Also unlocks Cash out.</span></li>
              <li><b>Apply for your card</b><span>Your verified details are filled in — add your contact details</span></li>
              <li><b>Create your card</b><span>After approval: {usd(state.fees.applicationUsd)} once, plus the balance you load</span></li>
            </ol>
            <ul className="card-facts">
              <li><b>Loading fee</b><span>{state.fees.loadPercent}% + {usd(state.fees.loadFlatUsd)} per load, shown before you pay</span></li>
              <li><b>Paid from your balance</b><span>USDG on Robinhood Chain · 1 USDG = $1.00</span></li>
              <li><b>Control</b><span>See card details, freeze and unfreeze any time</span></li>
            </ul>
            {state.stage === 'kyc-rejected' && <Alert tone="warn">Your last verification was not approved. You can try again with a valid ID.</Alert>}
            {!state.enabled && <Alert tone="info">The card service is being activated. You can apply as soon as it is live.</Alert>}
            <button type="button" className="ui-btn primary block card-apply" disabled={Boolean(busy) || !state.enabled} onClick={() => void verify()}>
              {busy === 'verify' ? <><Spinner /> Opening verification…</> : state.stage === 'kyc-rejected' ? 'Try verification again' : 'Verify identity'}
            </button>
          </>
        )}
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
      </section>

      {card && (
        <section className="ui-panel" style={{ gridColumn: '1 / -1' }}>
          <div className="ui-panel-head"><div><span className="ui-kicker">Activity</span><h2>Card transactions</h2></div></div>
          {!state.transactions?.length ? <Empty title="No transactions yet">Purchases appear here as soon as they are authorised.</Empty> : (
            <div className="ui-rows">{state.transactions.map((t) => (
              <div className="ui-row" key={t.id}><div className="ui-row-main"><b>{t.description || 'Card payment'}</b><span>{t.status.toLowerCase()}{t.at ? ` · ${relativeTime(new Date(Number(t.at)).toISOString())}` : ''}</span></div><div className="ui-row-end"><b>{usd(t.amount)}</b><span>{t.currency}</span></div></div>
            ))}</div>
          )}
        </section>
      )}

      <Modal open={Boolean(sensitive)} onClose={() => setSensitive(null)} label="Card details">
        {sensitive && (
          <div className="ui-grid" style={{ gap: 12 }}>
            <span className="ui-kicker">Card details · hidden again in 45 seconds</span>
            <div className="ui-kv">
              <div><span>Card number</span><b className="ui-mono">{sensitive.cardNumber?.replace(/(.{4})/g, '$1 ')}</b></div>
              <div><span>Expiry</span><b>{String(sensitive.expiryMonth).padStart(2, '0')}/{sensitive.expiryYear}</b></div>
              <div><span>CVV</span><b className="ui-mono">{sensitive.cvv}</b></div>
            </div>
            <p className="ui-muted">Never share these details with anyone who contacts you. ROBANK will never ask for them.</p>
            <button type="button" className="ui-btn secondary" onClick={() => setSensitive(null)}>Hide</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function CardPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">Card</span><h1>ROBANK Card</h1><p>A virtual Visa card you load with USDG and control from here.</p></div></header>
        <Card />
      </div>
    </AppShell>
  );
}
