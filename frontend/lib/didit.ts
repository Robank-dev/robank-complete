'use client';

/**
 * Opens a Didit verification in the in-page modal. The SDK is loaded on demand; if it cannot
 * start (blocked script, old browser), the hosted flow opens in a new tab instead.
 */
export async function openDiditVerification(url: string, onDone?: (result: 'completed' | 'cancelled' | 'failed') => void) {
  try {
    const { DiditSdk } = await import('@didit-protocol/sdk-web');
    DiditSdk.shared.onComplete = (result) => onDone?.(result.type);
    await DiditSdk.shared.startVerification({ url });
  } catch {
    const tab = window.open(url, '_blank');
    if (tab) tab.opener = null; else window.location.href = url;
  }
}
