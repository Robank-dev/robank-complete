'use client';

import Link from 'next/link';
import { amount, usd } from '@/lib/format';
import type { Holding } from '@/lib/server/portfolio';
import { Alert, Empty, Skeleton, TokenIcon } from './ui';

const KIND_LABEL: Record<Holding['kind'], string> = { stablecoin: 'Stablecoin', native: 'Gas token', xstock: 'xStock', 'stock-token': 'Stock Token' };

export default function Holdings({ holdings, loading, error, onRetry, limit }: { holdings: Holding[]; loading: boolean; error: string; onRetry: () => void; limit?: number }) {
  if (loading && !holdings.length) {
    return <div className="ui-rows">{[0, 1, 2].map((i) => <div className="ui-row" key={i}><Skeleton h={38} w={38} /><div className="ui-row-main"><Skeleton h={14} w="40%" /><Skeleton h={12} w="25%" /></div><Skeleton h={14} w={70} /></div>)}</div>;
  }
  if (error && !holdings.length) {
    return <Alert tone="bad" title="Balances unavailable." action={<button type="button" className="ui-btn secondary sm" onClick={onRetry}>Retry</button>}>{error}</Alert>;
  }
  if (!holdings.length) {
    return <Empty title="No assets yet" action={<Link href="/receive" className="ui-btn secondary sm">Receive funds</Link>}>Deposit USDC, USDT, USDG or a supported token to your ROBANK address to get started.</Empty>;
  }
  const shown = limit ? holdings.slice(0, limit) : holdings;
  return (
    <div className="ui-rows">
      {shown.map((h) => (
        <div className="ui-row" key={h.id}>
          <TokenIcon src={h.logo} label={h.symbol} chainId={h.chainId} />
          <div className="ui-row-main"><b>{h.symbol}</b><span>{h.kind === 'stablecoin' || h.kind === 'native' ? h.network : `${h.name} · ${h.network}`} · {KIND_LABEL[h.kind]}</span></div>
          <div className="ui-row-end"><b>{h.valueUsd != null ? usd(h.valueUsd) : 'No price'}</b><span>{amount(h.quantity, 6)} {h.symbol}</span></div>
        </div>
      ))}
      {limit && holdings.length > limit && <p className="ui-muted" style={{ paddingTop: 10 }}>+ {holdings.length - limit} more holdings</p>}
    </div>
  );
}
