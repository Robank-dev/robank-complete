import { requireSession } from '@/lib/server/auth';
import { HttpError, handle, ok } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { alchemyUrl } from '@/lib/server/rpc';

export const dynamic = 'force-dynamic';

export type HistoryItem = {
  hash: string;
  direction: 'in' | 'out' | 'self';
  asset: string;
  amount: number | null;
  contract: string | null;
  counterparty: string;
  at: string | null;
  block: number;
};

async function transfers(url: string, filter: { fromAddress?: string; toAddress?: string }) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'alchemy_getAssetTransfers', params: [{ ...filter, category: ['external', 'erc20'], order: 'desc', withMetadata: true, excludeZeroValue: true, maxCount: '0x32' }] })
  });
  const body = await response.json().catch(() => null) as any;
  if (!response.ok || body?.error) throw new Error(body?.error?.message || `History ${response.status}`);
  return (body?.result?.transfers || []) as any[];
}

// Wallet activity for the signed-in account only: transfers in and out of its own address.
export const GET = handle(async (request: Request) => {
  const session = await requireSession(request);
  await rateLimit(`history:${session.userId}`, 20, 60);
  const url = alchemyUrl();
  if (!url) throw new HttpError(503, 'Transaction history is being activated. Please try again soon.');
  if (!session.evmAddress) return ok({ items: [] });
  const me = session.evmAddress.toLowerCase();
  let sent: any[], received: any[];
  try {
    [sent, received] = await Promise.all([transfers(url, { fromAddress: me }), transfers(url, { toAddress: me })]);
  } catch (error) {
    console.error('[robank] history error', error instanceof Error ? error.message : error);
    throw new HttpError(502, 'Your history could not be loaded right now. Try again in a moment.');
  }
  const seen = new Set<string>();
  const items: HistoryItem[] = [];
  for (const t of [...sent, ...received]) {
    const key = String(t.uniqueId || `${t.hash}:${t.asset}:${t.from}:${t.to}`);
    if (seen.has(key)) continue;
    seen.add(key);
    const from = String(t.from || '').toLowerCase();
    const to = String(t.to || '').toLowerCase();
    const direction = from === me && to === me ? 'self' : from === me ? 'out' : 'in';
    items.push({
      hash: String(t.hash),
      direction,
      asset: String(t.asset || (t.category === 'external' ? 'ETH' : 'Token')),
      amount: typeof t.value === 'number' ? t.value : null,
      contract: t.rawContract?.address || null,
      counterparty: direction === 'out' ? to : from,
      at: t.metadata?.blockTimestamp || null,
      block: parseInt(String(t.blockNum || '0x0'), 16)
    });
  }
  items.sort((a, b) => b.block - a.block);
  return ok({ items: items.slice(0, 60) });
});
