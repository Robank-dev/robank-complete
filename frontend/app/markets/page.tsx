'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { Alert, Badge, Empty, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { friendlyError } from '@/lib/errors';

type Service = { slug: string; name: string; description: string; websiteUrl: string | null; category: string; verified: boolean; riskLevel: string; minPriceUsd: number | null; networks: string[]; endpointCount: number; uptime24h: number | null };
type Bounty = { id: string; title: string; description: string; rewardUsdc: number | null; url: string };
const CATEGORIES = ['All', 'AI', 'Compute', 'Data', 'Finance', 'Verification', 'Other'];

function risk(level: string) {
  if (['high', 'critical', 'blocked'].includes(level)) return <Badge tone="bad">Risk: {level}</Badge>;
  if (level === 'clean' || level === 'low') return <Badge tone="ok">Risk: {level}</Badge>;
  return <Badge tone="warn">Risk: {level || 'unknown'}</Badge>;
}

function Market() {
  const [tab, setTab] = useState<'services' | 'bounties'>('services');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [data, setData] = useState<{ services: Service[]; externalBounties: Bounty[]; bountiesAvailable: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback((q: string, c: string) => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ limit: '40' });
    if (q.trim()) params.set('q', q.trim());
    if (c !== 'All') params.set('category', c);
    api.agentMarket(params.toString()).then(setData).catch((e) => setError(friendlyError(e, 'The Agent Market is unavailable right now.'))).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load('', 'All'); }, [load]);

  return (
    <div className="ui-grid" style={{ gap: 14 }}>
      <Alert tone="info" title="Discovery only.">These are third-party services that accept x402 machine payments on Base or Robinhood Chain, listed by x402-list.com. ROBANK does not vet or pay them from the app yet — review a provider yourself before using it.</Alert>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div className="ui-seg" role="tablist"><button type="button" className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}>Services</button><button type="button" className={tab === 'bounties' ? 'active' : ''} onClick={() => setTab('bounties')}>External bounties</button></div>
        {tab === 'services' && <form style={{ display: 'flex', gap: 8 }} onSubmit={(e) => { e.preventDefault(); load(query, category); }}><input className="ui-input" style={{ minHeight: 40, maxWidth: 260 }} value={query} maxLength={80} onChange={(e) => setQuery(e.target.value)} placeholder="GPU, scraping, data…" aria-label="Search services" /><button className="ui-btn secondary sm" type="submit">Search</button></form>}
      </div>
      {tab === 'services' && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{CATEGORIES.map((c) => <button key={c} type="button" className={`ui-chip${category === c ? ' active' : ''}`} onClick={() => { setCategory(c); load(query, c); }}>{c}</button>)}</div>}
      {error ? <Alert tone="bad" action={<button className="ui-btn secondary sm" onClick={() => load(query, category)}>Retry</button>}>{error}</Alert>
        : loading && !data ? <div className="ui-grid three">{[0, 1, 2].map((i) => <Skeleton key={i} h={160} />)}</div>
          : tab === 'services' ? (
            !data?.services.length ? <section className="ui-panel"><Empty title="No matching services">Try a broader search.</Empty></section> : (
              <div className="ui-grid three" style={{ opacity: loading ? 0.6 : 1 }}>
                {data.services.map((s) => (
                  <article key={s.slug} className="ui-panel" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><h3>{s.name}</h3>{s.verified ? <Badge tone="ok" plain>Verified</Badge> : <Badge tone="off" plain>Unverified</Badge>}</div>
                    <p className="ui-muted" style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.description || 'No description provided.'}</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{risk(s.riskLevel)}<Badge plain>{s.category}</Badge></div>
                    <div className="ui-kv"><div><span>From</span><b>{s.minPriceUsd != null ? `$${s.minPriceUsd}` : '—'}</b></div><div><span>Networks</span><b>{s.networks.join(', ')}</b></div><div><span>Uptime 24h</span><b>{s.uptime24h != null ? `${s.uptime24h}%` : '—'}</b></div></div>
                    {s.websiteUrl && <a className="ui-btn ghost sm" href={s.websiteUrl} target="_blank" rel="noreferrer noopener">Visit provider ↗</a>}
                  </article>
                ))}
              </div>
            )
          ) : !data?.bountiesAvailable ? <Alert tone="warn">The external bounty feed is unavailable right now.</Alert> : !data.externalBounties.length ? <section className="ui-panel"><Empty title="No claimable bounties right now" /></section> : (
            <div className="ui-grid two">{data.externalBounties.map((b) => (
              <article key={b.id} className="ui-panel" style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><h3>{b.title}</h3>{b.rewardUsdc != null && <Badge tone="live" plain>{b.rewardUsdc} USDC</Badge>}</div>
                <p className="ui-muted">{b.description}</p>
                <a className="ui-btn ghost sm" href={b.url} target="_blank" rel="noreferrer noopener">Open on Agent Bounties ↗</a>
              </article>
            ))}</div>
          )}
    </div>
  );
}

export default function MarketsPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">Agent Market</span><h1>Services for AI agents</h1><p>Find pay-per-use APIs, compute and data services that accept x402 payments.</p></div></header>
        <Market />
      </div>
    </AppShell>
  );
}
