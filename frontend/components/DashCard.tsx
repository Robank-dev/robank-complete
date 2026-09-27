'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type CardState } from '@/lib/api';
import { usd } from '@/lib/format';
import { publishCardState, statusFromCard } from '@/lib/hooks/useAccountStatus';
import AccountSteps from './AccountSteps';
import CardFace from './CardFace';
import { Badge, Skeleton } from './ui';

/** Overview summary of the user's ROBANK Card: the card itself once issued, otherwise where they are in getting one. */
export default function DashCard() {
  const [state, setState] = useState<CardState | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { api.card().then((s) => { setState(s); publishCardState(s); }).catch(() => setFailed(true)); }, []);

  const card = state?.card;
  const frozen = card?.status === 'DISABLE';
  const head = (badge?: React.ReactNode) => (
    <div className="ui-panel-head"><div><span className="ui-kicker">Card</span><h2>ROBANK Card</h2></div>{badge}</div>
  );

  if (!state && !failed) return <section className="ui-panel">{head()}<Skeleton h={180} /></section>;

  if (card) {
    return (
      <section className="ui-panel dash-card">
        {head(<Badge tone={frozen ? 'warn' : 'ok'}>{frozen ? 'Frozen' : 'Active'}</Badge>)}
        <AccountSteps status={statusFromCard(state!)} />
        <Link href="/card" className="dash-card-face"><CardFace number={card.cardNumber} name={card.cardholderName} frozen={frozen} balance={card.availableBalance} /></Link>
        <div className="ui-kv">
          <div><span>Card balance</span><b>{usd(card.availableBalance)}</b></div>
          <div><span>Spent</span><b>{usd(card.totalConsumption)}</b></div>
        </div>
        <div className="dash-card-actions">
          <Link href="/card" className="ui-btn primary sm">Add money</Link>
          <Link href="/card" className="ui-btn ghost sm">Card details</Link>
        </div>
      </section>
    );
  }

  const stage = state?.stage || 'none';
  const copy = stage === 'kyc-pending' ? { badge: <Badge tone="pending">Verifying</Badge>, text: 'Your identity check is in progress. Finish it to get your card.', cta: 'Continue verification' }
    : stage === 'ready-to-issue' ? { badge: <Badge tone="ok">Approved</Badge>, text: 'Your card is approved. Create it and load it from your USDG balance.', cta: 'Create my card' }
      : stage === 'review' ? { badge: <Badge tone="pending">In review</Badge>, text: 'You are verified and your card application is being reviewed.', cta: 'View status' }
      : stage === 'apply' ? { badge: <Badge tone="ok">Verified</Badge>, text: 'You are verified. Apply for your card — your details are already filled in.', cta: 'Apply for card' }
      : stage === 'kyc-rejected' ? { badge: <Badge tone="bad">Not approved</Badge>, text: 'Your last verification was not approved. You can try again with a valid ID.', cta: 'Try again' }
        : { badge: <Badge tone="off">Not verified</Badge>, text: `A virtual Visa card for online spending. Verify your identity, then get your card for ${state ? usd(state.fees.applicationUsd) : '$5.50'} once.`, cta: 'Verify identity' };

  return (
    <section className="ui-panel dash-card">
      {head(copy.badge)}
      {state && <AccountSteps status={statusFromCard(state)} />}
      <Link href="/card" className="dash-card-face preview"><CardFace /></Link>
      <p className="ui-muted" style={{ margin: 0 }}>{copy.text}</p>
      <div className="dash-card-actions"><Link href="/card" className="ui-btn primary sm">{copy.cta}</Link></div>
    </section>
  );
}
