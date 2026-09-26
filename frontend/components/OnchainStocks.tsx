'use client';

import { api } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';

type Stock = {
  provider: 'xstocks' | 'robinhood';
  network: string;
  networkKey: 'base' | 'solana' | 'robinhood';
  symbol: string;
  ticker: string;
  name: string;
  logo?: string | null;
  price?: number | null;
  marketCap?: number | null;
  changePercent?: number | null;
  priceSource?: string | null;
  changeSource?: string | null;
};

const NETWORKS = [
  { key: 'all', label: 'All' },
  { key: 'solana', label: 'Solana' },
  { key: 'robinhood', label: 'Robinhood' },
  { key: 'base', label: 'Base' }
] as const;

function money(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—';
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function compactUsd(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toLocaleString()}`;
}

function StockLogo({ stock }: { stock: Stock }) {
  const [failed, setFailed] = useState(false);
  const fallback = stock.symbol.slice(0, 2).toUpperCase();
  if (!stock.logo || failed) {
    return <div className="stocks-logo stocks-logo-fallback">{fallback}</div>;
  }
  return <div className="stocks-logo"><img src={stock.logo} alt={`${stock.symbol} logo`} onError={() => setFailed(true)} /></div>;
}

function ChainIcon({ networkKey }: { networkKey: Stock['networkKey'] }) {
  const src = {
    base: '/chain-icons/base.svg',
    solana: '/chain-icons/solana.svg',
    robinhood: '/chain-icons/robinhood.svg'
  }[networkKey];
  return <img className="stocks-chain-icon" src={src} alt="" aria-hidden="true" />;
}

function MoveLine({ value }: { value: number | null | undefined }) {
  if (value == null || !Number.isFinite(Number(value))) {
    return <svg className="stocks-move-line na" viewBox="0 0 44 18" aria-label="1D change unavailable"><path d="M2 9H42" /></svg>;
  }
  const positive = Number(value) >= 0;
  const magnitude = Math.min(Math.max(Math.abs(Number(value) || 0), 0.4), 8);
  const y = positive ? 13 - magnitude : 5 + magnitude;
  return (
    <svg className={`stocks-move-line ${positive ? 'up' : 'down'}`} viewBox="0 0 44 18" role="img" aria-label={`${positive ? 'Up' : 'Down'} ${Math.abs(Number(value)).toFixed(2)} percent over 1D`}>
      <path d={`M2 12 L10 ${positive ? 11 : 13} L18 ${positive ? 8 : 12} L27 ${positive ? 9 - magnitude * .35 : 11 + magnitude * .35} L35 ${positive ? 5 : 13} L42 ${y}`} />
      <circle cx="42" cy={y} r="1.8" />
    </svg>
  );
}

export default function OnchainStocks() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [network, setNetwork] = useState<(typeof NETWORKS)[number]['key']>('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [counts, setCounts] = useState({ base: 0, solana: 0, robinhood: 0 });
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const data = await api.stocks();
        if (cancelled) return;
        setStocks(data.stocks || []);
        setCounts(data.networks || { base: 0, solana: 0, robinhood: 0 });
        setGeneratedAt(data.generatedAt || '');
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Stock market data unavailable');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const timer = window.setInterval(load, 60_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  const uniqueStocks = useMemo(() => {
    const seen = new Set<string>();
    return stocks.filter((stock) => {
      const key = `${stock.networkKey}:${stock.symbol}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [stocks]);

  const featured = useMemo(() => uniqueStocks.slice(0, 6), [uniqueStocks]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return uniqueStocks.filter((stock) => {
      if (network !== 'all' && stock.networkKey !== network) return false;
      if (!needle) return true;
      return [stock.name, stock.symbol, stock.ticker, stock.provider, stock.network]
        .some((value) => String(value || '').toLowerCase().includes(needle));
    });
  }, [uniqueStocks, network, query]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="stocks-page-head">
        <div>
          <div className="stocks-kicker">ROBANK / MARKETS</div>
          <h1>xStocks</h1>
        </div>
        <div className="stocks-updated">
          <span className="stocks-live-dot" />
          {generatedAt ? `UPDATED ${new Date(generatedAt).toLocaleTimeString()}` : 'LIVE DATA'}
        </div>
      </div>

      <section className="stocks-surface">
        {featured.length > 0 && (
          <div className="stocks-featured-strip">
            {featured.map((stock) => (
              <button type="button" key={'featured-' + stock.networkKey + '-' + stock.symbol} className="stocks-featured-card" onClick={() => setSelectedStock(stock)}>
                <StockLogo stock={stock} />
                <div><b>{stock.symbol}</b><span>{stock.network}</span></div>
                <strong>{money(stock.price)}</strong>
              </button>
            ))}
          </div>
        )}

        <div className="stocks-toolbar">
          <div className="stocks-search-wrap">
            <svg className="stocks-search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></svg>
            <label className="sr-only" htmlFor="stocks-search">Search xStocks</label>
            <input
              id="stocks-search"
              type="search"
              inputMode="search"
              autoComplete="off"
              aria-label="Search xStocks"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search xStocks..."
            />
            {query && <button type="button" className="stocks-search-clear" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
            <span className="stocks-search-count">{visible.length}</span>
          </div>
          <div className="stocks-network-filters" aria-label="Filter by network">
            {NETWORKS.map((item) => (
              <button
                type="button"
                key={item.key}
                onClick={() => setNetwork(item.key)}
                aria-pressed={network === item.key}
                className={`stocks-network-filter ${network === item.key ? 'active' : ''}`}
              >
                {item.key === 'all' ? <span className="stocks-all-mark">ALL</span> : <ChainIcon networkKey={item.key as Stock['networkKey']} />}
                <span>{item.label === 'Robinhood' ? 'RH' : item.label}</span>
                {item.key !== 'all' && <small>{counts[item.key as keyof typeof counts]}</small>}
              </button>
            ))}
          </div>
        </div>

        <div className="hidden grid-cols-[minmax(260px,1.8fr)_130px_140px_150px_125px] gap-4 border-b border-white/8 px-5 py-3 text-[8px] font-mono uppercase tracking-[.16em] text-white/20 md:grid">
          <span>Symbol</span><span>Network</span><span>Price</span><span>Market Cap</span><span>1D</span>
        </div>

        {error && <div className="m-4 rounded-xl border border-white/10 bg-white/[.02] p-4 text-sm text-white/45">{error}</div>}

        {loading ? (
          <div className="p-10 text-center text-sm text-white/30">Loading onchain stock universe…</div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/30">No stock products match this filter.</div>
        ) : (
          <div>
            {visible.map((stock) => {
              const change = stock.changePercent;
              const positive = Number(change) >= 0;
              return (
                <article key={`${stock.networkKey}-${stock.symbol}-${stock.ticker}`} className="stocks-row" onClick={() => setSelectedStock(stock)}>
                  <div className="min-w-0 flex items-center gap-3">
                    <StockLogo stock={stock} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold tracking-tight">{stock.symbol}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 md:mt-0">
                    <ChainIcon networkKey={stock.networkKey} />
                    <span className="text-[10px] text-white/55">{stock.network}</span>
                  </div>

                  <div className="mt-4 md:mt-0">
                    <div className="stocks-metric-value">{money(stock.price)}</div>
                  </div>

                  <div className="mt-4 md:mt-0">
                    <div className="stocks-metric-value">{compactUsd(stock.marketCap)}</div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 md:mt-0">
                    <MoveLine value={change} />
                    <a href={'/receive?asset=' + encodeURIComponent(stock.symbol) + '&chain=' + encodeURIComponent(stock.networkKey)} className="stocks-row-action" onClick={(event) => event.stopPropagation()}>Receive</a>
                    <div>
                      <div className={`text-sm font-medium ${positive ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {change == null ? '—' : `${positive ? '+' : ''}${change.toFixed(2)}%`}
                      </div>
                      <div className="mt-1 stocks-metric-label">1D</div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {selectedStock && (
        <section className="stocks-detail-card">
          <div className="stocks-detail-main">
            <StockLogo stock={selectedStock} />
            <div><span className="stocks-kicker">ASSET</span><h2>{selectedStock.symbol}</h2><p>{selectedStock.name} · {selectedStock.network}</p></div>
          </div>
          <div className="stocks-detail-metrics">
            <div><span>PRICE</span><b>{money(selectedStock.price)}</b></div>
            <div><span>1D</span><b>{selectedStock.changePercent == null ? '—' : (selectedStock.changePercent >= 0 ? '+' : '') + selectedStock.changePercent.toFixed(2) + '%'}</b></div>
            <div><span>MARKET CAP</span><b>{compactUsd(selectedStock.marketCap)}</b></div>
          </div>
          <div className="stocks-detail-actions">
            <a href={'/receive?asset=' + encodeURIComponent(selectedStock.symbol) + '&chain=' + encodeURIComponent(selectedStock.networkKey)} className="stocks-detail-link">Receive this asset →</a>
            <button type="button" onClick={() => setSelectedStock(null)}>Close</button>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-2 text-[9px] leading-5 text-white/25 md:flex-row md:items-center md:justify-between">
        <span>{visible.length.toLocaleString()} shown · {uniqueStocks.length.toLocaleString()} total unique</span>
        <span>Price/logo: provider data · Market cap + 1D move: underlying listing data · Not a brokerage order screen.</span>
      </div>
    </div>
  );
}

