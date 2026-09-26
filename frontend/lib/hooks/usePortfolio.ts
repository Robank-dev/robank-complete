'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { api, type PortfolioResponse } from '@/lib/api';
import type { Holding } from '@/lib/server/portfolio';

type State = {
  data: (PortfolioResponse & { staleSources: string[] }) | null;
  loading: boolean;
  error: string;
  owner: string;
};

let state: State = { data: null, loading: false, error: '', owner: '' };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

function sourceOf(h: Holding) {
  return h.chainId === 1151111081099710 ? 'solana' : `evm:${h.chainId}`;
}

/**
 * Merges a new read into the last known state. If a network failed this time, its previously
 * confirmed holdings are kept (and flagged stale) instead of being replaced with zero.
 */
function merge(previous: State['data'], next: PortfolioResponse): NonNullable<State['data']> {
  const failed = new Set(next.sources.filter((s) => !s.ok).map((s) => s.id));
  if (!previous || !failed.size) return { ...next, staleSources: [] };
  const carried = previous.holdings.filter((h) => failed.has(sourceOf(h)) || (failed.has('xstocks') && h.kind === 'xstock') || (failed.has('robinhood-tokens') && h.kind === 'stock-token'));
  const keep = next.holdings.filter((h) => !carried.some((c) => c.id === h.id));
  const holdings = [...keep, ...carried].sort((a, b) => (b.valueUsd ?? -1) - (a.valueUsd ?? -1));
  return {
    ...next,
    holdings,
    totalUsd: holdings.reduce((sum, h) => sum + (h.valueUsd ?? 0), 0),
    staleSources: next.sources.filter((s) => !s.ok && previous.sources.some((p) => p.id === s.id && p.ok)).map((s) => s.label)
  };
}

async function load(owner: string, fresh = false) {
  if (inflight) return inflight;
  if (state.owner !== owner) state = { data: null, loading: false, error: '', owner };
  set({ loading: true, error: '' });
  inflight = api.portfolio(fresh)
    .then((next) => set({ data: merge(state.data, next), loading: false, error: '' }))
    .catch((error) => set({ loading: false, error: error instanceof Error ? error.message : 'Portfolio unavailable.' }))
    .finally(() => { inflight = null; });
  return inflight;
}

export function usePortfolio(owner: string) {
  const snapshot = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => state,
    () => state
  );

  useEffect(() => {
    if (!owner) return;
    if (state.owner !== owner || (!state.data && !state.loading)) void load(owner);
    // Refresh when the user comes back to the tab, at most once every 30s. No background polling.
    let last = Date.now();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && Date.now() - last > 30_000) {
        last = Date.now();
        void load(owner);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [owner]);

  const refresh = useCallback(() => (owner ? load(owner, true) : Promise.resolve()), [owner]);
  const mine = snapshot.owner === owner ? snapshot : { data: null, loading: Boolean(owner), error: '', owner };
  return { ...mine, refresh };
}
