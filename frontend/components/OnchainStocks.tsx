'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { explorerAddress } from '@/lib/chains';
import { friendlyError } from '@/lib/errors';
import { amount, short, usd } from '@/lib/format';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';
import type { StockRow } from '@/app/api/stocks/route';
import CopyButton from './CopyButton';
import { Alert, Badge, Empty, Modal, Skeleton, TokenIcon } from './ui';

const PAGE = 60;

export default function OnchainStocks() {
  const account = useRobankAccount();
  const portfolio = usePortfolio(account.user?.id || '');
  const [rows, setRows] = useState<StockRow[] | null>(null);
  const [providers, setProviders] = useState<{ xstocks: boolean; robinhood: boolean; prices: boolean } | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState<'all' | 'xstocks' | 'robinhood' | 'held'>('all');
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<StockRow | null>(null);

  const load = () => {
    setError('');
    api.stocks().then((d: any) => { setRows(d.stocks); setProviders(d.providers); }).catch((e) => setError(friendlyError(e, 'Stock data is unavailable right now.')));
  };
  useEffect(load, []);

  const held = useMemo(() => {
    const map = new Map<string, { quantity: string; valueUsd: number | null; chainId: number }[]>();
    for (const h of portfolio.data?.holdings || []) {
      if (h.kind !== 'xstock' && h.kind !== 'stock-token') continue;
      const key = `${h.kind === 'xstock' ? 'xstocks' : 'robinhood'}:${h.symbol}`;
      map.set(key, [...(map.get(key) || []), { quantity: h.quantity, valueUsd: h.valueUsd, chainId: h.chainId }]);
    }
    return map;
  }, [portfolio.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (rows || []).filter((r) => {
      if (provider === 'held' && !held.has(`${r.provider}:${r.symbol}`)) return false;
      if (provider !== 'all' && provider !== 'held' && r.provider !== provider) return false;
      return !q || r.symbol.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.underlying.toLowerCase() === q;
    }).sort((a, b) => Number(held.has(`${b.provider}:${b.symbol}`)) - Number(held.has(`${a.provider}:${a.symbol}`)));
  }, [rows, query, provider, held]);

  useEffect(() => setLimit(PAGE), [query, provider]);

  return (
    <div className="ui-grid" style={{ gap: 14 }}>
      <Alert tone="info" title="What these are.">xStocks and Robinhood Stock Tokens are tokenized products issued by third parties that track a company&apos;s share price. They are not shares, carry no voting rights, and are not issued by ROBANK. ROBANK shows their data and lets you hold and transfer them in your wallet — it does not buy or sell them.</Alert>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="ui-seg" role="tablist" aria-label="Filter">
          {([['all', 'All'], ['xstocks', 'xStocks'], ['robinhood', 'Robinhood'], ['held', 'You hold']] as const).map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={provider === id} className={provider === id ? 'active' : ''} onClick={() => setProvider(id)}>{label}</button>
          ))}
        </div>
        <input className="ui-input" style={{ maxWidth: 280, minHeight: 40 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search AAPL, Tesla, NVDAx…" aria-label="Search stocks" />
      </div>

      {providers && (!providers.xstocks || !providers.robinhood || !providers.prices) && (
        <Alert tone="warn">{[!providers.xstocks && 'the xStocks catalog', !providers.robinhood && 'the Robinhood token list', !providers.prices && 'reference prices'].filter(Boolean).join(', ')} could not be loaded right now, so this list may be incomplete.</Alert>
      )}

      <section className="ui-panel tight">
        {error ? <Alert tone="bad" action={<button className="ui-btn secondary sm" onClick={load}>Retry</button>}>{error}</Alert>
          : !rows ? <div className="ui-grid">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} h={44} />)}</div>
            : !filtered.length ? <Empty title={provider === 'held' ? 'You do not hold any tokenized stocks' : 'No matches'}>{provider === 'held' ? 'Tokens you receive in your ROBANK wallet appear here.' : 'Try a ticker or company name.'}</Empty>
              : (
                <div className="ui-table-wrap">
                  <table className="ui-table">
                    <thead><tr><th>Asset</th><th>Issuer</th><th>Networks</th><th className="ui-num">Ref. price</th></tr></thead>
                    <tbody>
                      {filtered.slice(0, limit).map((r) => {
                        const mine = held.get(`${r.provider}:${r.symbol}`);
                        return (
                          <tr key={r.id} className="clickable" onClick={() => setSelected(r)}>
                            <td><div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}><TokenIcon src={r.logo} label={r.symbol} size={30} /><div style={{ minWidth: 0 }}><b>{r.symbol}</b> {mine && <Badge tone="ok" plain>Held</Badge>}{r.halted && <Badge tone="warn" plain>Halted</Badge>}<div className="ui-muted" style={{ fontSize: 12, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div></div></div></td>
                            <td className="ui-muted" style={{ fontSize: 12 }}>{r.provider === 'xstocks' ? 'xStocks' : 'Robinhood'}</td>
                            <td className="ui-muted" style={{ fontSize: 12 }}>{r.networks.map((n) => n.label).join(', ')}</td>
                            <td className="ui-num">{usd(r.priceUsd)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filtered.length > limit && <div style={{ textAlign: 'center', padding: 12 }}><button type="button" className="ui-btn ghost sm" onClick={() => setLimit((l) => l + PAGE)}>Show more ({filtered.length - limit} left)</button></div>}
                </div>
              )}
      </section>
      <p className="ui-muted">Reference prices are the underlying share&apos;s last sale from the Nasdaq screener (× token multiplier where applicable). They are indicative, can be delayed, and are not a quote you can trade at.</p>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} label={selected ? `${selected.symbol} details` : 'Details'}>
        {selected && (
          <div className="ui-grid" style={{ gap: 14 }}>
            <div className="ui-panel-head" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><TokenIcon src={selected.logo} label={selected.symbol} size={44} /><div><span className="ui-kicker">{selected.instrument}</span><h2>{selected.symbol}</h2><p className="ui-muted">{selected.name}</p></div></div>
              <button type="button" className="shell-icon-btn" aria-label="Close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="ui-kv">
              <div><span>Issuer</span><b>{selected.issuer}</b></div>
              <div><span>Tracks</span><b>{selected.underlying}{selected.multiplier !== 1 ? ` × ${selected.multiplier.toFixed(4)}` : ''}</b></div>
              <div><span>Reference price</span><b>{usd(selected.priceUsd)}</b></div>
              <div><span>Price source</span><b>{selected.priceSource}</b></div>
              {held.get(`${selected.provider}:${selected.symbol}`)?.map((h) => <div key={h.chainId}><span>You hold</span><b>{amount(h.quantity, 6)} {selected.symbol}{h.valueUsd != null ? ` · ${usd(h.valueUsd)}` : ''}</b></div>)}
            </div>
            <div>
              <span className="ui-label">Contracts</span>
              <div className="ui-rows">
                {selected.networks.map((n) => (
                  <div className="ui-row" key={n.chainId}>
                    <div className="ui-row-main"><b>{n.label}</b><span className="ui-mono">{short(n.address, 10, 8)}</span></div>
                    <CopyButton value={n.address} compact label={`Copy ${n.label} contract`} />
                    <a className="ui-btn ghost sm" href={explorerAddress(n.chainId, n.address)} target="_blank" rel="noreferrer">↗</a>
                    <Link className="ui-btn secondary sm" href={`/receive?asset=${encodeURIComponent(selected.symbol)}&chain=${n.chainId}` as any}>Receive</Link>
                  </div>
                ))}
              </div>
            </div>
            {selected.halted && <Alert tone="warn">The issuer reports trading as halted for this asset.</Alert>}
            <p className="ui-muted">Eligibility, minting and redemption are set by {selected.issuer} and may not be available in your country. ROBANK has no brokerage and cannot buy or sell this asset for you.</p>
            {held.has(`${selected.provider}:${selected.symbol}`) && <Link className="ui-btn primary" href={`/send?asset=${encodeURIComponent(selected.symbol)}&chain=${held.get(`${selected.provider}:${selected.symbol}`)![0].chainId}` as any}>Send {selected.symbol}</Link>}
          </div>
        )}
      </Modal>
    </div>
  );
}
