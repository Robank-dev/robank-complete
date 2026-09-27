'use client';

import { useSyncExternalStore } from 'react';

export type ConfirmRow = { label: string; value: string; mono?: boolean };
export type ConfirmRequest = {
  title: string;
  rows: ConfirmRow[];
  /** Network fee estimate, e.g. "≈ 0.000012 ETH ($0.03)". Omitted for signatures. */
  fee?: string;
  /** Shown instead of the confirm button when the transaction cannot go through (e.g. no ETH for gas). */
  blocked?: string;
  note?: string;
  action?: string;
};

type Pending = ConfirmRequest & { resolve: (ok: boolean) => void };

let current: Pending | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Opens ROBANK's own confirmation sheet. Resolves true only when the user presses confirm. */
export function requestConfirm(request: ConfirmRequest): Promise<boolean> {
  current?.resolve(false);
  return new Promise((resolve) => { current = { ...request, resolve }; emit(); });
}

export function settleConfirm(ok: boolean) {
  const pending = current;
  current = null;
  emit();
  pending?.resolve(ok);
}

export function useConfirmRequest() {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => current, () => null);
}
