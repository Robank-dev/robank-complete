'use client';

import { ROBANK_TOKEN, tokenLive } from '@/lib/token';
import { chainById } from '@/lib/chains';
import { short } from '@/lib/format';
import CopyButton from './CopyButton';

/** $ROBANK ticker with its contract address: small, copyable, never in the way. */
export default function TokenPill({ variant = 'pill', className = '' }: { variant?: 'pill' | 'side' | 'foot'; className?: string }) {
  const live = tokenLive();
  const ca = ROBANK_TOKEN.address;
  if (variant === 'side' && !live) return null;
  return (
    <div className={`tk tk-${variant} ${className}`}>
      <img src={ROBANK_TOKEN.logo} alt="" />
      <b>${ROBANK_TOKEN.symbol}</b>
      {live && (
        <>
          <a className="tk-ca ui-mono" href={`${chainById(ROBANK_TOKEN.chainId)?.explorer}/token/${ca}`} target="_blank" rel="noreferrer" title={ca}>{short(ca, 6, 4)}</a>
          <CopyButton value={ca} compact label="Copy CA" className="tk-copy" />
          {ROBANK_TOKEN.buyUrl && <a className="tk-buy" href={ROBANK_TOKEN.buyUrl} target="_blank" rel="noreferrer">Buy</a>}
        </>
      )}
      {!live && variant !== 'side' && <span className="tk-note">on Robinhood Chain</span>}
    </div>
  );
}
