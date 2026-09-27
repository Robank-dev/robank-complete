'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell, { Icon } from '@/components/AppShell';
import { Alert, Badge, Empty, Skeleton } from '@/components/ui';
import { api, type HistoryItem } from '@/lib/api';
import { ROBINHOOD_CHAIN_ID, explorerTx } from '@/lib/chains';
import { friendlyError } from '@/lib/errors';
import { amount, relativeTime, short } from '@/lib/format';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';

type Pending = { hash: string; title: string; at: number };

function pendingFor(address: string): Pending[] {
  try { return JSON.parse(localStorage.getItem(`rb:pending:${address.toLowerCase()}`) || '[]').filter((p: Pending) => Date.now() - p.at < 3_600_000); } catch { return []; }
}

function History() {
  const account = useRobankAccount();
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    api.history().then((r) => setItems(r.items)).catch((e) => setError(friendlyError(e, 'Your history could not be loaded right now.')));
  }, []);
  useEffect(() => { if (account.authenticated) load(); }, [account.authenticated, load]);
  useEffect(() => { if (account.evmAddress) setPending(pendingFor(account.evmAddress)); }, [account.evmAddress, items]);

  // Transactions sent from ROBANK show instantly; they drop off once the indexer has them.
  const known = new Set((items || []).map((i) => i.hash.toLowerCase()));
  const waiting = pending.filter((p) => !known.has(p.hash.toLowerCase()));

  return (
    <div className="ui-page narrow">
      <header className="ui-head"><div><span className="ui-kicker">History</span><h1>Transactions</h1><p>Money in and out of your ROBANK wallet on Robinhood Chain.</p></div></header>
      <section className="ui-panel">
        {error && !items ? (
          <Alert tone="bad" action={<button type="button" className="ui-btn secondary sm" onClick={load}>Retry</button>}>{error}</Alert>
        ) : !items ? (
          <div className="ui-rows">{[0, 1, 2, 3, 4].map((i) => <div className="ui-row" key={i}><Skeleton h={38} w={38} /><div className="ui-row-main"><Skeleton h={14} w="45%" /><Skeleton h={12} w="30%" /></div><Skeleton h={14} w={80} /></div>)}</div>
        ) : !items.length && !waiting.length ? (
          <Empty title="No transactions yet" action={<Link href="/receive" className="ui-btn secondary sm">Receive funds</Link>}>Deposits and payments will show up here.</Empty>
        ) : (
          <div className="ui-rows">
            {waiting.map((p) => (
              <a className="ui-row hist-row" key={p.hash} href={explorerTx(ROBINHOOD_CHAIN_ID, p.hash)} target="_blank" rel="noreferrer">
                <span className="hist-icon out"><Icon name="clock" size={16} /></span>
                <div className="ui-row-main"><b>{p.title}</b><span>{relativeTime(new Date(p.at).toISOString())}</span></div>
                <div className="ui-row-end"><Badge tone="pending">Processing</Badge></div>
              </a>
            ))}
            {items.map((t, i) => (
              <a className="ui-row hist-row" key={`${t.hash}:${i}`} href={explorerTx(ROBINHOOD_CHAIN_ID, t.hash)} target="_blank" rel="noreferrer">
                <span className={`hist-icon ${t.direction}`}><Icon name={t.direction === 'in' ? 'down' : 'up'} size={16} /></span>
                <div className="ui-row-main">
                  <b>{t.direction === 'in' ? 'Received' : t.direction === 'self' ? 'Moved' : 'Sent'} {t.asset}</b>
                  <span>{t.direction === 'in' ? 'From' : 'To'} <span className="ui-mono">{short(t.counterparty, 6, 4)}</span>{t.at ? ` · ${relativeTime(t.at)}` : ''}</span>
                </div>
                <div className="ui-row-end"><b className={t.direction === 'in' ? 'hist-in' : undefined}>{t.direction === 'in' ? '+' : t.direction === 'out' ? '−' : ''}{t.amount != null ? amount(String(t.amount), 6) : '—'} {t.asset}</b></div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function HistoryPage() {
  return <AppShell><History /></AppShell>;
}
