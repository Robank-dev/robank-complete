'use client';

import { useState } from 'react';
import { api, type MarketCall, type MarketService } from '@/lib/api';
import { friendlyError } from '@/lib/errors';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';
import { signX402Payment } from '@/lib/onchain';
import { Alert, Badge, Spinner } from './ui';

type Stage = 'idle' | 'form' | 'pricing' | 'confirm' | 'paying' | 'done' | 'error';

const price = (usd: number) => (usd < 0.01 ? `$${usd.toFixed(4).replace(/0+$/, '')}` : `$${usd.toFixed(2)}`);

function Result({ result }: { result: { type: string; text?: string; dataUrl?: string } }) {
  if (result.dataUrl?.startsWith('data:image/')) return <img className="mk-result-img" src={result.dataUrl} alt="Service result" />;
  if (result.dataUrl?.startsWith('data:audio/')) return <audio controls src={result.dataUrl} style={{ width: '100%' }} />;
  let text = result.text || '';
  try { text = JSON.stringify(JSON.parse(text), null, 2); } catch {}
  return <pre className="mk-result">{text || '(empty response)'}</pre>;
}

/** A paid x402 service: fill inputs, see the live price, sign an exact USDG authorization, see the result. */
export default function MarketRun({ service, compact }: { service: MarketService; compact?: boolean }) {
  const account = useRobankAccount();
  const [stage, setStage] = useState<Stage>('idle');
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(service.fields.map((f) => [f.name, f.example])));
  const [body, setBody] = useState(service.body || '{}');
  const [quote, setQuote] = useState<Extract<MarketCall, { status: 'payment-required' }> | null>(null);
  const [output, setOutput] = useState<Extract<MarketCall, { status: 'ok' | 'error' }> | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');

  const request = () => ({ id: service.id, params: Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim())), body: service.method === 'POST' ? body : undefined });

  async function getPrice() {
    setError(''); setStage('pricing');
    try {
      const reply = await api.marketCall(request());
      if (reply.status === 'payment-required') { setQuote(reply); setStage('confirm'); }
      else { setOutput(reply); setStage('done'); } // free or cached call
    } catch (e) {
      setError(friendlyError(e, 'The service could not be reached.')); setStage('error');
    }
  }

  async function pay() {
    if (!quote) return;
    setError(''); setStage('paying');
    try {
      if (!account.evmWallet) throw new Error('Your wallet is still loading. Try again in a moment.');
      setProgress('Waiting for your confirmation…');
      const payment = await signX402Payment({ wallet: account.evmWallet, requirement: quote.requirement, x402Version: quote.x402Version, resource: quote.resource,
        review: { title: `Pay ${service.name}`, rows: [{ label: 'Price', value: `${price(quote.priceUsd)} USDG` }, { label: 'Paid to', value: `${String(quote.requirement.payTo).slice(0, 8)}…${String(quote.requirement.payTo).slice(-6)}`, mono: true }], note: 'You sign an authorization for exactly this amount. No network fee.', action: 'Sign & pay' } });
      setProgress(`Calling ${service.name}…`);
      const reply = await api.marketCall({ ...request(), payment });
      if (reply.status === 'payment-required') throw new Error('The service asked for payment again. Nothing extra was signed.');
      setOutput(reply); setStage('done');
    } catch (e) {
      setError(friendlyError(e, 'The call did not complete.')); setStage('error');
    }
  }

  return (
    <article className={`mk-card${compact ? ' compact' : ''}`}>
      <div className="mk-head">
        <span className="mk-icon">{service.icon ? <img src={service.icon} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : service.name.slice(0, 1)}</span>
        <div className="mk-title"><b>{service.name}</b><span className="ui-mono">{new URL(service.url).host}{new URL(service.url).pathname}</span></div>
        <span className="mk-price">{price(service.priceUsd)}<small>per call</small></span>
      </div>
      <p className="mk-desc">{service.description || 'No description provided.'}</p>
      {!!service.tags.length && <div className="mk-tags">{service.tags.slice(0, 4).map((t) => <Badge key={t} plain>{t}</Badge>)}</div>}

      {stage === 'idle' && <div className="mk-actions"><button type="button" className="ui-btn primary sm" onClick={() => setStage('form')}>Run</button><span className="ui-muted">Paid in USDG · Robinhood Chain</span></div>}

      {stage !== 'idle' && (
        <div className="mk-run">
          {service.method === 'GET' ? service.fields.map((f) => (
            <label className="ui-field" key={f.name}>
              <span className="ui-label">{f.name}{f.required ? ' *' : ''}{f.description && <em>{f.description}</em>}</span>
              <input className="ui-input" value={values[f.name] || ''} maxLength={500} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} disabled={stage === 'paying'} />
            </label>
          )) : (
            <label className="ui-field"><span className="ui-label">Request body <em>JSON</em></span><textarea className="ui-textarea ui-mono" rows={5} value={body} onChange={(e) => setBody(e.target.value)} disabled={stage === 'paying'} /></label>
          )}
          {!service.fields.length && service.method === 'GET' && <p className="ui-muted" style={{ fontSize: 12 }}>This service takes no inputs.</p>}

          {stage === 'confirm' && quote && (
            <div className="mk-confirm">
              <div className="ui-kv">
                <div><span>Price</span><b>{price(quote.priceUsd)} USDG</b></div>
                <div><span>Paid to</span><b className="ui-mono">{String(quote.requirement.payTo).slice(0, 8)}…{String(quote.requirement.payTo).slice(-6)}</b></div>
                <div><span>Network</span><b>Robinhood Chain</b></div>
              </div>
              <p className="ui-muted" style={{ fontSize: 12 }}>You sign a one-time authorization for exactly this amount. It is settled only when the service answers.</p>
            </div>
          )}
          {stage === 'paying' && <div className="ui-alert"><Spinner /> <span>{progress}</span></div>}
          {error && <Alert tone="bad">{error}</Alert>}
          {stage === 'done' && output && (
            <div className="mk-output">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <Badge tone={output.status === 'ok' ? 'ok' : 'bad'}>{output.status === 'ok' ? (output.paid ? 'Paid · done' : 'Done') : `Error ${output.httpStatus}`}</Badge>
              </div>
              <Result result={output.result} />
            </div>
          )}

          <div className="mk-actions">
            {(stage === 'form' || stage === 'error') && <button type="button" className="ui-btn primary sm" onClick={() => void getPrice()}>Get price</button>}
            {stage === 'pricing' && <button type="button" className="ui-btn primary sm" disabled><Spinner /> Checking price…</button>}
            {stage === 'confirm' && <button type="button" className="ui-btn primary sm" onClick={() => void pay()}>Pay {quote ? price(quote.priceUsd) : ''} & run</button>}
            {stage === 'done' && <button type="button" className="ui-btn secondary sm" onClick={() => { setOutput(null); setQuote(null); setStage('form'); }}>Run again</button>}
            {stage !== 'paying' && <button type="button" className="ui-btn ghost sm" onClick={() => { setStage('idle'); setQuote(null); setOutput(null); setError(''); }}>Close</button>}
          </div>
        </div>
      )}
    </article>
  );
}
