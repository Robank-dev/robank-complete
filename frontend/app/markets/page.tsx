'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import MarketRun from '@/components/MarketRun';
import { Alert, Empty, Skeleton } from '@/components/ui';
import { api, type MarketService } from '@/lib/api';
import { friendlyError } from '@/lib/errors';

const TOPICS = ['All', 'Stocks', 'Earnings', 'News', 'Search', 'Crypto', 'Speech', 'Image', 'Security', 'Random'];

function Market() {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('All');
  const [services, setServices] = useState<MarketService[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback((q: string) => {
    setLoading(true);
    setError('');
    api.market(q, 48).then((d) => setServices(d.services)).catch((e) => setError(friendlyError(e, 'The Agent Market is unavailable right now.'))).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q')?.slice(0, 80) || '';
    setQuery(q);
    load(q);
  }, [load]);

  return (
    <div className="ui-grid" style={{ gap: 14 }}>
      <div className="mk-toolbar">
        <div className="mk-topics">{TOPICS.map((t) => <button key={t} type="button" className={`ui-chip${topic === t ? ' active' : ''}`} onClick={() => { setTopic(t); const q = t === 'All' ? '' : t; setQuery(q); load(q); }}>{t}</button>)}</div>
        <form className="mk-search" onSubmit={(e) => { e.preventDefault(); setTopic(''); load(query); }}>
          <input className="ui-input" value={query} maxLength={80} onChange={(e) => setQuery(e.target.value)} placeholder="Earnings calendar, text to speech, search…" aria-label="Search services" />
          <button className="ui-btn secondary sm" type="submit">Search</button>
        </form>
      </div>
      {error ? <Alert tone="bad" action={<button className="ui-btn secondary sm" onClick={() => load(query)}>Retry</button>}>{error}</Alert>
        : loading && !services ? <div className="mk-grid">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} h={190} />)}</div>
          : !services?.length ? <section className="ui-panel"><Empty title="No matching services">No listed service matches this search yet. Try a broader word.</Empty></section>
            : <div className="mk-grid" style={{ opacity: loading ? 0.6 : 1 }}>{services.map((s) => <MarketRun key={s.id} service={s} />)}</div>}
      <p className="ui-muted" style={{ fontSize: 12 }}>Services are listed in the Coinbase x402 Bazaar and run by third parties. ROBANK only shows services that accept USDG on Robinhood Chain and never pays more than 5 USDG per call.</p>
    </div>
  );
}

export default function MarketsPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">Agent Market</span><h1>Paid agents & APIs</h1><p>Run AI tools, data feeds and APIs and pay per call in USDG on Robinhood Chain. You see the exact price and sign before anything is paid — or just ask the AI agent.</p></div></header>
        <Market />
      </div>
    </AppShell>
  );
}
