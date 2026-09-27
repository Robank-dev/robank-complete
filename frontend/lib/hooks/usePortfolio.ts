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
  return `evm:${h.chainId}`;
}

/**
 * Merges a new read into the last known state. If a network failed this time, its previously
 * confirmed holdings are kept (and flagged stale) instead of being replaced with zero.
 */
function merge(previous: State['data'], next: PortfolioResponse): NonNullable<State['data']> {
  const failed = new Set(next.sources.filter((s) => !s.ok).map((s) => s.id));
  if (!previous || !failed.size) return { ...next, staleSources: [] };
  const carried = previous.holdings.filter((h) => failed.has(sourceOf(h)) || (failed.has('robinhood-tokens') && h.kind === 'stock-token'));
  const keep = next.holdings.filter((h) => !carried.some((c) => c.id === h.id));
  const holdings = [...keep, ...carried].sort((a, b) => (b.valueUsd ?? -1) - (a.valueUsd ?? -1));
  return {
    ...next,
    holdings,
    totalUsd: holdings.reduce((sum, h) => sum + (h.valueUsd ?? 0), 0),
    staleSources: next.sources.filter((s) => !s.ok && previous.sources.some((p) => p.id === s.id && p.ok)).map((s) => s.label)
  };
}

const CACHE = 'rb:portfolio:';

/** Last confirmed balances from this device, so the dashboard paints instantly while a fresh read runs. */
function cached(owner: string): State['data'] {
  try {
    const hit = JSON.parse(localStorage.getItem(CACHE + owner) || 'null');
    return hit && Array.isArray(hit.holdings) ? { ...hit, staleSources: [] } : null;
  } catch { return null; }
}

function store(owner: string, data: NonNullable<State['data']>) {
  try { localStorage.setItem(CACHE + owner, JSON.stringify(data)); } catch {}
}

/** Removes cached balances from this device (on sign-out). */
export function forgetPortfolio() {
  try { Object.keys(localStorage).filter((k) => k.startsWith('rb:')).forEach((k) => localStorage.removeItem(k)); } catch {}
  state = { data: null, loading: false, error: '', owner: '' };
}

let lastLoad = 0;

async function load(owner: string, fresh = false) {
  if (inflight) return inflight;
  lastLoad = Date.now();
  if (state.owner !== owner) state = { data: cached(owner), loading: false, error: '', owner };
  set({ loading: true, error: '' });
  inflight = api.portfolio(fresh)
    .then((next) => { const data = merge(state.data, next); set({ data, loading: false, error: '' }); if (data.sources.every((s) => s.ok)) store(owner, data); })
    .catch((error) => set({ loading: false, error: error instanceof Error ? error.message : 'Portfolio unavailable.' }))
    .finally(() => { inflight = null; });
  return inflight;
}

/** Last known ETH price, used to show network fees in dollars. */
export function ethPriceUsd() {
  return state.data?.holdings.find((h) => h.kind === 'native')?.priceUsd ?? null;
}

export function usePortfolio(owner: string) {
  // Switch to this account's cached balances before the first paint, not after an effect.
  if (owner && state.owner !== owner && !inflight && typeof window !== 'undefined') state = { data: cached(owner), loading: true, error: '', owner };
  const snapshot = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => state,
    () => state
  );

  useEffect(() => {
    if (!owner) return;
    if (!state.data || state.loading || state.owner !== owner) void load(owner);
    // Keep balances current while the tab is visible (every 30s) and right after returning to it.
    const tick = () => { if (document.visibilityState === 'visible' && Date.now() - lastLoad > 25_000) void load(owner); };
    const timer = window.setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [owner]);

  const refresh = useCallback(() => (owner ? load(owner, true) : Promise.resolve()), [owner]);
  const mine = snapshot.owner === owner ? snapshot : { data: null, loading: Boolean(owner), error: '', owner };
  return { ...mine, refresh };
}
