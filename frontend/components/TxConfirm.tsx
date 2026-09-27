'use client';

import { settleConfirm, useConfirmRequest } from '@/lib/txConfirm';
import { Alert, Modal } from './ui';

/** The single confirmation sheet used for every transaction and signature in the app. */
export default function TxConfirm() {
  const request = useConfirmRequest();
  return (
    <Modal open={Boolean(request)} onClose={() => settleConfirm(false)} label={request?.title || 'Confirm'}>
      {request && (
        <div className="tx-confirm">
          <div><span className="ui-kicker">Confirm</span><h2>{request.title}</h2></div>
          <div className="ui-kv">
            {request.rows.map((r) => <div key={r.label}><span>{r.label}</span><b className={r.mono ? 'ui-mono' : undefined}>{r.value}</b></div>)}
            {request.fee && <div><span>Network fee</span><b>{request.fee}</b></div>}
            <div><span>Network</span><b style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><img src="/chain-icons/robinhood.svg" alt="" width={14} height={14} />Robinhood Chain</b></div>
          </div>
          {request.note && <p className="ui-muted" style={{ fontSize: 13 }}>{request.note}</p>}
          {request.blocked && <Alert tone="warn">{request.blocked}</Alert>}
          <div className="tx-confirm-actions">
            <button type="button" className="ui-btn ghost" onClick={() => settleConfirm(false)}>Cancel</button>
            {!request.blocked && <button type="button" className="ui-btn primary" autoFocus onClick={() => settleConfirm(true)}>{request.action || 'Confirm'}</button>}
          </div>
        </div>
      )}
    </Modal>
  );
}
