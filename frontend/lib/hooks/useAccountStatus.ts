'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { api, type CardState } from '@/lib/api';

/** Identity + card status: not verified → verifying → verified (no card yet) → card active. */
export type AccountStatus = { level: 'unverified' | 'verifying' | 'rejected' | 'verified' | 'review' | 'ready' | 'card'; frozen: boolean };

let status: AccountStatus | null = null;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function statusFromCard(state: CardState): AccountStatus {
  if (state.card) return { level: 'card', frozen: state.card.status === 'DISABLE' };
  const level = state.stage === 'ready-to-issue' ? 'ready' : state.stage === 'review' ? 'review'
    : state.stage === 'apply' || state.stage === 'review-rejected' ? 'verified'
      : state.stage === 'kyc-pending' ? 'verifying' : state.stage === 'kyc-rejected' ? 'rejected' : 'unverified';
  return { level, frozen: false };
}

/** Pages that already loaded the card state (Card, Overview) share it instead of fetching again. */
export function publishCardState(state: CardState) {
  status = statusFromCard(state);
  listeners.forEach((l) => l());
}

export function forgetAccountStatus() { status = null; }

export function useAccountStatus() {
  const snapshot = useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => status, () => null);
  useEffect(() => {
    if (status || inflight) return;
    inflight = api.card().then(publishCardState).catch(() => undefined).finally(() => { inflight = null; });
  }, []);
  return snapshot;
}

/** Compact labels for tight spaces like the sidebar. */
export const STATUS_SHORT: Record<AccountStatus['level'], string> = { unverified: 'Not verified', verifying: 'Verifying', rejected: 'Not approved', verified: 'Verified', review: 'Verified · Card review', ready: 'Verified · Card ready', card: 'Verified · Card' };

export const STATUS_COPY: Record<AccountStatus['level'], { label: string; tone: 'ok' | 'pending' | 'bad' | 'off' | 'warn' }> = {
  unverified: { label: 'Not verified', tone: 'off' },
  verifying: { label: 'Verifying', tone: 'pending' },
  rejected: { label: 'Not approved', tone: 'bad' },
  verified: { label: 'Verified · no card yet', tone: 'ok' },
  review: { label: 'Verified · card in review', tone: 'ok' },
  ready: { label: 'Verified · card ready to create', tone: 'ok' },
  card: { label: 'Verified · card active', tone: 'ok' }
};
