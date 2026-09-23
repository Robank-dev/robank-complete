'use client';

import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import { useAccount } from 'wagmi';
import { api } from '@/lib/api';

type BorrowQuote = Awaited<ReturnType<typeof api.borrowQuote>>['quotes'][number];

export default function BorrowPage() {
  const [quotes, setQuotes] = useState<BorrowQuote[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [amount, setAmount] = useState('1000');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { address } = useAccount();
  const [borrowStatus, setBorrowStatus] = useState<Awaited<ReturnType<typeof api.borrowStatus>> | null>(null);
  const [positionLoading, setPositionLoading] = useState(false);
  const [positionError, setPositionError] = useState('');

  useEffect(() => {
    let active = true;

    api.borrowQuote()
      .then((data) => {
        if (!active) return;
        setQuotes(data.quotes || []);
        setSelectedMarketId(data.quotes?.[0]?.marketId || '');
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!address) {
      setBorrowStatus(null);
      setPositionError('');
      setPositionLoading(false);
      return () => {
        active = false;
      };
    }

    setPositionLoading(true);
    setPositionError('');

    api.borrowStatus(address)
      .then((data) => {
        if (!active) return;
        setBorrowStatus(data);
      })
      .catch((err) => {
        if (!active) return;
        setBorrowStatus(null);
        setPositionError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (active) setPositionLoading(false);
      });

    return () => {
      active = false;
    };
  }, [address]);
  const selected = useMemo(
    () => quotes.find((quote) => quote.marketId === selectedMarketId) || null,
    [quotes, selectedMarketId]
  );

  const borrowAmount = Number(amount) || 0;

  const targetLtv = selected?.liquidationLtv
    ? Math.min(selected.liquidationLtv * 0.8, 0.5)
    : 0;

  const selectedPosition = useMemo(
    () =>
      borrowStatus?.positions.find(
        (position) => position.marketId === selectedMarketId
      ) || null,
    [borrowStatus, selectedMarketId]
  );

  const collateralUsd = Number(
    selectedPosition?.risk &&
      typeof selectedPosition.risk === 'object' &&
      'collateralUsd' in selectedPosition.risk
      ? selectedPosition.risk.collateralUsd
      : 0
  );

  const debtUsd = Number(
    selectedPosition?.risk &&
      typeof selectedPosition.risk === 'object' &&
      'debtUsd' in selectedPosition.risk
      ? selectedPosition.risk.debtUsd
      : 0
  );

  const borrowCapacityUsd = selectedPosition?.borrowCapacityUsd || 0;

  const estimatedLtv =
    collateralUsd > 0
      ? (debtUsd + borrowAmount) / collateralUsd
      : null;

  const currentLtv =
    collateralUsd > 0
      ? debtUsd / collateralUsd
      : null;

  const risk =
    !address
      ? 'CONNECT WALLET'
      : positionLoading
        ? 'LOADING POSITION'
        : positionError
          ? 'POSITION UNAVAILABLE'
          : !selectedPosition || collateralUsd <= 0
            ? 'COLLATERAL REQUIRED'
            : estimatedLtv !== null &&
                selected?.liquidationLtv &&
                estimatedLtv >= selected.liquidationLtv
              ? 'LIQUIDATION RISK'
              : estimatedLtv !== null &&
                  selected?.liquidationLtv &&
                  estimatedLtv >= selected.liquidationLtv * 0.85
                ? 'HIGH RISK'
                : estimatedLtv !== null &&
                    selected?.liquidationLtv &&
                    estimatedLtv >= selected.liquidationLtv * 0.70
                  ? 'ATTENTION'
                  : 'HEALTHY';

  const riskCopy =
    !address
      ? 'Connect a wallet to read your live Morpho collateral position.'
      : positionLoading
        ? 'Loading your live Morpho position.'
        : positionError
          ? 'Your Morpho position could not be loaded.'
          : !selectedPosition || collateralUsd <= 0
            ? 'No eligible collateral position is available for this market.'
            : `Current collateral is ${collateralUsd.toLocaleString()} with ${debtUsd.toLocaleString()} debt.`;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="text-xs uppercase tracking-[.2em] text-white/40">
            ROBANK CREDIT
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Unlock liquidity without selling.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            Borrow against eligible capital through connected lending rails.
            Market terms below are sourced from the connected Morpho/Base market feed.
          </p>
        </div>

        {loading && (
          <section className="rounded-2xl border border-ro-line bg-ro-panel p-5 text-sm text-white/50">
            Loading live credit marketsÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦
          </section>
        )}

        {error && (
          <section className="rounded-2xl border border-white/10 bg-ro-panel p-5 text-sm text-white/50">
            Credit market data is currently unavailable.
            <div className="mt-2 text-xs text-white/30">{error}</div>
          </section>
        )}

        {!loading && !error && quotes.length === 0 && (
          <section className="rounded-2xl border border-white/10 bg-ro-panel p-5 text-sm text-white/50">
            No listed Morpho credit markets are currently available.
          </section>
        )}

        {!loading && !error && selected && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <section className="rounded-2xl border border-ro-line bg-ro-panel p-5">
              <div className="text-[10px] uppercase tracking-[.16em] text-white/40">
                01 / CREDIT MARKET
              </div>
              <h2 className="mt-2 text-xl font-medium">
                Choose the market backing the borrow.
              </h2>

              <div className="mt-5 space-y-3">
                {quotes.map((market) => {
                  const active = selected.marketId === market.marketId;

                  return (
                    <button
                      key={market.marketId}
                      onClick={() => setSelectedMarketId(market.marketId)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        active
                          ? 'border-white/30 bg-white/[.05]'
                          : 'border-white/10 bg-black/10 hover:bg-white/[.03]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium">
                            {market.collateralAsset || 'Unknown collateral'}
                          </div>
                          <div className="mt-1 text-xs text-white/40">
                            Borrow {market.loanAsset || 'Unknown asset'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {(market.liquidationLtv * 100).toFixed(2)}% LLTV
                          </div>
                          <div className="mt-1 text-[9px] font-mono text-white/35">
                            {market.capacityStatus.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 p-4">
                  <div className="text-[9px] font-mono text-white/30">
                    BORROW APY
                  </div>
                  <div className="mt-2 text-lg font-medium">
                    {(selected.borrowApy * 100).toFixed(2)}%
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 p-4">
                  <div className="text-[9px] font-mono text-white/30">
                    UTILIZATION
                  </div>
                  <div className="mt-2 text-lg font-medium">
                    {(selected.utilization * 100).toFixed(2)}%
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 p-4">
                  <div className="text-[9px] font-mono text-white/30">
                    LIQUIDITY
                  </div>
                  <div className="mt-2 text-lg font-medium">
                    ${selected.liquidityUsd.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-white/[.02] p-4 text-xs leading-5 text-white/40">
                Market listing confirms that the market exists. Actual collateral
                availability, wallet eligibility, custody and execution remain
                provider- and position-dependent.
              </div>
            </section>

            <section className="rounded-2xl border border-ro-line bg-ro-panel p-5">
              <div className="text-[10px] uppercase tracking-[.16em] text-white/40">
                02 / BORROW
              </div>
              <h2 className="mt-2 text-xl font-medium">
                How much liquidity do you need?
              </h2>

              <div className="mt-6">
                <label className="text-[10px] uppercase tracking-[.16em] text-white/35">
                  {selected.loanAsset || 'LOAN ASSET'} AMOUNT
                </label>

                <div className="mt-2 flex items-center rounded-xl border border-white/10 bg-black/20 px-4">
                  <span className="text-lg text-white/40">$</span>
                  <input
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/[^0-9.]/g, ''))
                    }
                    inputMode="decimal"
                    className="w-full bg-transparent px-2 py-4 text-3xl font-semibold outline-none"
                  />
                  <span className="text-xs font-mono text-white/35">
                    {selected.loanAsset || 'ASSET'}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between border-t border-white/5 pt-3">
                  <span className="text-white/40">Market liquidity</span>
                  <b>{selected.liquidityUsd.toLocaleString()}</b>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">Collateral</span>
                  <b>${collateralUsd.toLocaleString()}</b>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">Existing debt</span>
                  <b>${debtUsd.toLocaleString()}</b>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">Available borrow capacity</span>
                  <b>${borrowCapacityUsd.toLocaleString()}</b>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">Target LTV</span>
                  <b>{(targetLtv * 100).toFixed(2)}%</b>
                </div>

                <div className="flex justify-between">
                  <span className="text-white/40">Projected LTV</span>
                  <b>
                    {estimatedLtv === null
                      ? 'Unavailable'
                      : (estimatedLtv * 100).toFixed(2) + '%'}
                  </b>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">POSITION HEALTH</span>
                  <span className="text-[10px] font-mono text-white/65">
                    {risk}
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-white transition-all"
                    style={{
                      width: `${selected.liquidationLtv && estimatedLtv !== null
                        ? Math.min((estimatedLtv / selected.liquidationLtv) * 100, 100)
                        : 0}%`
                    }}
                  />
                </div>

                <p className="mt-3 text-xs leading-5 text-white/40">
                  {riskCopy}
                </p>
              </div>

              <button
                disabled={
                  !address ||
                  positionLoading ||
                  !!positionError ||
                  !selectedPosition ||
                  collateralUsd <= 0 ||
                  borrowCapacityUsd <= 0 ||
                  borrowAmount <= 0 ||
                  borrowAmount > borrowCapacityUsd ||
                  selected.capacityStatus !== 'available'
                }
                className="mt-6 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-30"
              >
                Review Borrow
              </button>
            </section>
          </div>
        )}

        <section className="rounded-2xl border border-ro-line bg-ro-panel p-5">
          <div className="text-[10px] uppercase tracking-[.16em] text-white/40">
            03 / ROBANK AGENT
          </div>

          <div className="mt-2 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-medium">
                The agent keeps watching after you borrow.
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
                Once a credit position exists, ROBANK can monitor collateral,
                LTV, liquidity and repayment conditions inside the active mandate.
              </p>
            </div>

            <div className="shrink-0 rounded-full border border-white/10 px-3 py-2 text-[10px] font-mono text-white/50">
              CREDIT MONITOR
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            {['LTV', 'COLLATERAL', 'LIQUIDITY', 'REPAYMENT'].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 p-4">
                <div className="text-[9px] font-mono text-white/30">{item}</div>
                <div className="mt-2 text-lg font-medium">Monitor</div>
              </div>
            ))}
          </div>
        </section>

        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4 text-xs leading-5 text-white/35">
          ROBANK does not automatically represent itself as the lender. Credit
          execution, collateral terms, eligibility, custody and liquidation are
          determined by the connected lending market/provider.
        </div>
      </div>
    </AppShell>
  );
}


