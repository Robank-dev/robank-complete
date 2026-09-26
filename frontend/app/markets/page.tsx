'use client';

import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';

type Service = {
  slug: string;
  name: string;
  description: string;
  websiteUrl: string;
  category: string;
  paymentReady: boolean;
  verified: boolean;
  riskLevel: string;
  paymentMethods: string[];
  minPriceUsd: number | null;
  networks: string[];
  endpointCount: number;
  uptime24h: number | null;
};

type Bounty = {
  id: string;
  title: string;
  description: string;
  prizeAmount: string | null;
  prizeAsset: string | null;
  network: string | null;
  status: string;
  funded: boolean;
  createdAt?: string;
  dueAt?: string;
};

const CATEGORIES = ['All', 'AI', 'Compute', 'Data', 'Finance', 'Verification', 'Other'];
const PAYMENT_FILTERS = ['All', 'x402', 'Bank'] as const;

export default function MarketsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState<(typeof PAYMENT_FILTERS)[number]>('All');
  const [tab, setTab] = useState<'services' | 'bounties'>('services');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ limit: '30' });
      if (query.trim()) params.set('q', query.trim());
      if (category !== 'All') params.set('category', category);
      const data = await api.agentMarket(params.toString());
      setServices(data.services || []);
      setBounties(data.bounties || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Agent market unavailable');
      setServices([]);
      setBounties([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const visibleServices = useMemo(() => services.filter((service) => {
    if (paymentFilter === 'x402') return service.paymentMethods.some((method) => method.toLowerCase().includes('x402'));
    if (paymentFilter === 'Bank') return service.paymentMethods.some((method) => /bank|fiat|bank_transfer/i.test(method));
    return true;
  }), [services, paymentFilter]);

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 ro-markets-premium">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[.2em] text-white/35">ROBANK / AGENT MARKET</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Buy capability, not assets.</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Discover x402 services and machine-payable tools that an agent can access with internet-native payments. Bounties created in Jobs can also appear here.</p>
          </div>
          <Link href="/jobs" className="rounded-xl border border-white/10 px-4 py-3 text-xs text-white/60 hover:bg-white/5">Create bounty <span>→</span></Link>
        </div>

        <div className="rounded-2xl border border-ro-line bg-ro-panel p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(); }} placeholder="Search GPU, browser, data, inference, tools…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none placeholder:text-white/20" />
            <button onClick={load} className="rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black">Search</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORIES.map((value) => <button key={value} onClick={() => { setCategory(value); window.setTimeout(load, 0); }} className={`rounded-full border px-3 py-1.5 text-[9px] font-mono ${category === value ? 'border-white/20 bg-white/10 text-white' : 'border-white/8 text-white/30 hover:bg-white/5'}`}>{value}</button>)}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/8 pt-4">
            <span className="mr-1 text-[9px] font-mono uppercase tracking-[.14em] text-white/20">Pay with</span>
            {PAYMENT_FILTERS.map((value) => <button key={value} onClick={() => setPaymentFilter(value)} className={`rounded-full border px-3 py-1.5 text-[9px] font-mono ${paymentFilter === value ? 'border-white/20 bg-white/10 text-white' : 'border-white/8 text-white/30 hover:bg-white/5'}`}>{value}</button>)}
            <span className="ml-1 text-[9px] text-white/20">Bank services appear only when the provider directory explicitly exposes a bank/fiat rail.</span>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-white/8 pb-2">
          <button onClick={() => setTab('services')} className={`px-2 pb-2 text-xs ${tab === 'services' ? 'text-white' : 'text-white/30'}`}>Services</button>
          <button onClick={() => setTab('bounties')} className={`px-2 pb-2 text-xs ${tab === 'bounties' ? 'text-white' : 'text-white/30'}`}>Bounties {bounties.length ? `(${bounties.length})` : ''}</button>
        </div>

        {error && <div className="rounded-xl border border-white/10 p-4 text-sm text-white/45">{error}</div>}

        {tab === 'services' ? (
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {loading ? <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-ro-line p-8 text-sm text-white/35">Loading x402 services…</div> : visibleServices.map((service) => (
              <article key={service.slug} className="rounded-2xl border border-ro-line bg-ro-panel p-5 transition hover:border-white/15">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{service.name}</div>
                    <div className="mt-1 text-[9px] font-mono uppercase tracking-[.14em] text-white/25">{service.category}</div>
                  </div>
                  <span className={`rounded-full border px-2 py-1 text-[8px] font-mono ${service.paymentReady ? 'border-white/15 text-white/55' : 'border-white/8 text-white/25'}`}>{service.paymentReady ? '402 READY' : 'LISTED'}</span>
                </div>
                <p className="mt-4 text-xs leading-5 text-white/38 line-clamp-4">{service.description}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div><div className="text-[8px] font-mono text-white/20">FROM</div><div className="mt-1 text-sm">{service.minPriceUsd == null ? '—' : `$${service.minPriceUsd}`}</div></div>
                  <div><div className="text-[8px] font-mono text-white/20">UPTIME 24H</div><div className="mt-1 text-sm">{service.uptime24h == null ? '—' : `${service.uptime24h}%`}</div></div>
                </div>
                <div className="mt-4 flex gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-[8px] font-mono ${service.paymentMethods.some((m) => m.toLowerCase().includes('x402')) ? 'border-white/15 text-white/60' : 'border-white/8 text-white/25'}`}>x402 {service.paymentMethods.some((m) => m.toLowerCase().includes('x402')) ? '✓' : '—'}</span>
                  <span className={`rounded-full border px-2.5 py-1 text-[8px] font-mono ${service.paymentMethods.some((m) => /bank|fiat|bank_transfer/i.test(m)) ? 'border-white/15 text-white/60' : 'border-white/8 text-white/25'}`}>Bank {service.paymentMethods.some((m) => /bank|fiat|bank_transfer/i.test(m)) ? '✓' : '—'}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/8 pt-4 text-[9px] font-mono text-white/25"><span>{service.endpointCount} endpoint{service.endpointCount === 1 ? '' : 's'}</span><span>{service.networks.map((n) => n === 'eip155:8453' ? 'BASE' : n === 'eip155:4663' ? 'RHC' : n).join(' · ')}</span></div>
                <div className="mt-4 flex items-center justify-between"><a href={service.websiteUrl} target="_blank" rel="noreferrer" className="text-xs text-white/35 hover:text-white">Provider ↗</a><Link href={`/agent?service=${encodeURIComponent(service.slug)}`} className="text-xs text-white/65 hover:text-white">Use with Agent →</Link></div>
              </article>
            ))}
            {!loading && visibleServices.length === 0 && <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-ro-line p-8 text-sm text-white/35">No matching x402 services found.</div>}
          </section>
        ) : (
          <section className="space-y-3">
            {loading ? <div className="rounded-2xl border border-ro-line p-8 text-sm text-white/35">Loading bounties…</div> : bounties.length === 0 ? <div className="rounded-2xl border border-ro-line p-8 text-sm text-white/35">No open bounties yet. Create one from Jobs.</div> : bounties.map((bounty) => (
              <article key={bounty.id} className="rounded-2xl border border-ro-line bg-ro-panel p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div><h2 className="text-sm font-medium">{bounty.title}</h2><p className="mt-2 max-w-3xl whitespace-pre-wrap text-xs leading-5 text-white/40">{bounty.description}</p></div>
                  <span className="rounded-full border border-white/8 px-2.5 py-1 text-[8px] font-mono text-white/30">{bounty.funded ? 'FUNDED' : 'FUNDING REQUIRED'}</span>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/8 pt-4 text-[9px] font-mono text-white/30"><span>PRIZE {bounty.prizeAmount ? `${bounty.prizeAmount} ${bounty.prizeAsset || ''}` : 'NOT SET'}</span><span>{bounty.network || 'NETWORK PENDING'}</span><span>{String(bounty.status).toUpperCase()}</span></div>
              </article>
            ))}
          </section>
        )}

        <div className="rounded-xl border border-white/8 bg-white/[.02] px-4 py-3 text-xs leading-5 text-white/30"><span className="font-medium text-white/55">How it works:</span> discovery comes from the external x402 directory. ROBANK can inspect a service's payment terms before an agent pays; no service is treated as safe or successful merely because it is listed.</div>
      </div>
    </AppShell>
  );
}
