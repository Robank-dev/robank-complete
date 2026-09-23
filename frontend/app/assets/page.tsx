'use client';

import AppShell from '@/components/AppShell';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type Asset = {
  symbol: string;
  name: string;
  type: 'Stock' | 'RWA';
  network: 'Base' | 'Robinhood Chain';
  provider: string;
  status: string;
  price: number | null;
  priceLabel: string;
  collateral: string;
};

type AssetDiscovery = Awaited<ReturnType<typeof api.assetsDiscover>>;

export default function AssetsPage() {
  const [filter, setFilter] = useState<'All' | 'Stock' | 'RWA'>('All');
  const [network, setNetwork] = useState<'All' | 'Base' | 'Robinhood Chain'>('All');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [discovery, setDiscovery] = useState<AssetDiscovery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      try {
        setLoading(true);
        setError('');
        const data = await api.assetsDiscover();

        const mapped: Asset[] = data.assets.map((asset) => ({
          symbol: asset.symbol || (asset.vaultId ? 'VAULT-' + asset.vaultId.slice(0, 8).toUpperCase() : 'UNKNOWN'),
          name: asset.name || (asset.provider === 'centrifuge' ? 'Centrifuge RWA Vault' : 'Unnamed asset'),
          type: asset.type === 'stock-token' ? 'Stock' : 'RWA',
          network: asset.network === 'base' ? 'Base' : 'Robinhood Chain',
          provider: asset.provider === 'xstocks' ? 'xStocks' : asset.provider === 'centrifuge' ? 'Centrifuge' : 'Robinhood Chain',
          status: String(asset.status || 'unknown').toUpperCase(),
          price: null,
          priceLabel: asset.pricing?.oracle ? 'Oracle: ' + asset.pricing.oracle : 'Live quote unavailable',
          collateral: asset.collateral?.symbol ? 'Reference: ' + asset.collateral.symbol : 'Provider-dependent'
        }));

        if (!cancelled) {
          setDiscovery(data);
          setAssets(mapped);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setDiscovery(null);
          setAssets([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      assets.filter((asset) => {
        const typeMatch = filter === 'All' || asset.type === filter;
        const networkMatch = network === 'All' || asset.network === network;
        return typeMatch && networkMatch;
      }),
    [assets, filter, network]
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="text-xs uppercase tracking-[.2em] text-white/40">
            ROBANK ASSET CENTER
          </div>

          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Capital, in every rail.
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                Discover supported stock tokens and real-world assets across
                Base and Robinhood Chain.
              </p>
            </div>

            <Link href="/borrow" className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/70 hover:bg-white/5">
              Use capital for credit Ã¢â€ â€™
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
            <div className="text-[10px] uppercase tracking-[.16em] text-white/35">
              DISCOVERED ASSETS
            </div>
            <div className="mt-2 text-3xl font-semibold">{loading ? "?" : discovery?.count ?? 0}</div>
            <div className="mt-2 text-xs text-white/35">
              Current provider discovery
            </div>
          </div>

          <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
            <div className="text-[10px] uppercase tracking-[.16em] text-white/35">
              RWA RAILS
            </div>
            <div className="mt-2 text-3xl font-semibold">{loading ? "?" : discovery?.providers.centrifuge.ok ? "Base" : "Unavailable"}</div>
            <div className="mt-2 text-xs text-white/35">
              Centrifuge + supported providers
            </div>
          </div>

          <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
            <div className="text-[10px] uppercase tracking-[.16em] text-white/35">
              STOCK RAILS
            </div>
            <div className="mt-2 text-3xl font-semibold">{loading ? "?" : new Set(assets.filter((asset) => asset.type === "Stock").map((asset) => asset.network)).size}</div>
            <div className="mt-2 text-xs text-white/35">
              {loading
                ? 'Loading provider discovery'
                : Array.from(
                    new Set(
                      assets
                        .filter((asset) => asset.type === 'Stock')
                        .map((asset) => asset.network)
                    )
                  ).join(' + ') || 'No stock rail discovered'}
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-ro-line bg-ro-panel p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[.16em] text-white/35">
                ASSET UNIVERSE
              </div>
              <h2 className="mt-2 text-xl font-medium">
                What ROBANK can reason about.
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {(['All', 'Stock', 'RWA'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-mono ${
                    filter === value
                      ? 'border-white/25 bg-white/10 text-white'
                      : 'border-white/10 text-white/40 hover:bg-white/5'
                  }`}
                >
                  {value}
                </button>
              ))}

              <select
                value={network}
                onChange={(e) =>
                  setNetwork(e.target.value as 'All' | 'Base' | 'Robinhood Chain')
                }
                className="rounded-full border border-white/10 bg-black px-3 py-1.5 text-[10px] font-mono text-white/50 outline-none"
              >
                <option>All</option>
                <option>Base</option>
                <option>Robinhood Chain</option>
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-white/5">
            <div className="hidden grid-cols-[1.3fr_.8fr_.8fr_.8fr_.9fr] gap-4 border-b border-white/5 px-4 py-3 text-[9px] font-mono text-white/25 md:grid">
              <span>ASSET</span>
              <span>NETWORK</span>
              <span>PROVIDER</span>
              <span>PRICE</span>
              <span>COLLATERAL</span>
            </div>

            {filtered.map((asset) => (
              <div
                key={`${asset.network}-${asset.symbol}`}
                className="grid gap-3 border-b border-white/5 px-4 py-4 last:border-b-0 md:grid-cols-[1.3fr_.8fr_.8fr_.8fr_.9fr] md:items-center md:gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-xs">
                    {asset.symbol[0]}
                  </div>

                  <div>
                    <div className="text-sm font-medium">{asset.symbol}</div>
                    <div className="mt-1 text-xs text-white/35">
                      {asset.name} Ã‚Â· {asset.type}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-white/45">{asset.network}</div>

                <div>
                  <div className="text-xs text-white/55">{asset.provider}</div>
                  <div className="mt-1 text-[9px] font-mono text-white/25">
                    {asset.status}
                  </div>
                </div>

                <div>
                  <div className="text-sm">
                    {asset.price != null
                      ? '$' + asset.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4
                        })
                      : 'Unavailable'}
                  </div>
                  <div className="mt-1 text-[9px] text-white/25">
                    {asset.priceLabel}
                  </div>
                </div>
                <div className="text-xs text-white/45">
                  {asset.collateral}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-ro-line bg-ro-panel p-5">
          <div className="text-[10px] uppercase tracking-[.16em] text-white/35">
            ROBANK AGENT
          </div>

          <div className="mt-2 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-xl font-medium">
                Assets are inputs to the capital engine.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
                The agent can use supported asset data to monitor exposure,
                evaluate liquidity, check configured rules and prepare actions.
                Execution remains subject to provider availability, eligibility
                and the active ROBANK mandate.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
              {[
                ['MONITOR', 'Positions'],
                ['COMPARE', 'Exposure'],
                ['BORROW', 'Collateral'],
                ['REBALANCE', 'Policy']
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-white/10 p-3"
                >
                  <div className="text-[8px] font-mono text-white/25">
                    {label}
                  </div>
                  <div className="mt-2 text-xs text-white/55">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4 text-xs leading-5 text-white/30">
          Asset availability, eligibility, custody, pricing, transfer and
          collateral use are provider- and market-dependent. ROBANK does not
          automatically represent itself as the issuer or custodian of the
          underlying asset.
        </div>
      </div>
    </AppShell>
  );
}