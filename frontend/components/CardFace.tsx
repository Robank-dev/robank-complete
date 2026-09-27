'use client';

import { usd } from '@/lib/format';

/** The ROBANK Card visual, shared by the Card page, the Overview and the Overview reel. */
export default function CardFace({ number, name, frozen, balance }: { number?: string; name?: string; frozen?: boolean; balance?: number | null }) {
  return (
    <div className={`rb-card${frozen ? ' frozen' : ''}`} aria-hidden="true">
      <div className="rb-card-face">
        <div className="rb-card-top">
          <div className="rb-card-brand"><img src="/robank-mark.png" alt="" /><b>ROBANK</b></div>
          <svg className="rb-card-nfc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M8.5 7.5a6.5 6.5 0 0 1 0 9" /><path d="M12 5a10 10 0 0 1 0 14" /><path d="M15.5 2.8a13 13 0 0 1 0 18.4" /></svg>
        </div>
        <div className="rb-card-chip"><i /><i /><i /><i /></div>
        {balance != null && <div className="rb-card-balance">{usd(balance)}</div>}
        <div className="rb-card-number">{number ? number.replace(/(.{4})/g, '$1 ').replace(/\*/g, '•') : '•••• •••• •••• 4821'}</div>
        <div className="rb-card-bottom">
          <div><small>{frozen ? 'Status' : 'Cardholder'}</small><b>{frozen ? 'FROZEN' : name || 'YOUR NAME'}</b></div>
          <div className="rb-card-visa">VISA</div>
        </div>
      </div>
      <div className="rb-card-sheen" />
    </div>
  );
}
