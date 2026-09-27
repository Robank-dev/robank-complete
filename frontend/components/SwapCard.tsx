'use client';

import { useState } from 'react';
import { api, type SwapQuote } from '@/lib/api';
import { explorerTx, ROBINHOOD_CHAIN_ID } from '@/lib/chains';
import { friendlyError } from '@/lib/errors';
import { usd } from '@/lib/format';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { ensureAllowance, sendPrepared } from '@/lib/onchain';
import { TxCancelled } from '@/lib/tx';
import { Alert, Badge, Spinner, TokenIcon } from './ui';

type Stage = 'ready' | 'quoting' | 'signing' | 'done' | 'failed' | 'cancelled';

/** A Stock Token buy/sell on Robinhood Chain: live quote, exact approval, one signature. */
export default function SwapCard({ side, symbol, amount: initialAmount, quote: initialQuote }: { side: 'buy' | 'sell'; symbol: string; amount: string; quote: SwapQuote | null }) {
  const account = useRobankAccount();
  const portfolio = usePortfolio(account.user?.id || '');
  const [amount, setAmount] = useState(initialAmount);
  const [quote, setQuote] = useState<SwapQuote | null>(initialQuote);
  const [stage, setStage] = useState<Stage>('ready');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [hash, setHash] = useState('');

  const stock = quote?.stock;
  const spendSymbol = side === 'buy' ? 'USDG' : symbol;
  const held = portfolio.data?.holdings.find((h) => side === 'buy' ? h.kind === 'stablecoin' && h.symbol === 'USDG' : h.kind === 'stock-token' && h.symbol === symbol);

  async function refresh(next = amount) {
    if (!/^\d+(\.\d+)?$/.test(next) || Number(next) <= 0) { setError('Enter an amount above zero.'); return; }
    setError(''); setStage('quoting');
    try { setQuote((await api.swap({ side, symbol, amount: next })).quote); setStage('ready'); }
    catch (e) { setError(friendlyError(e, 'No quote is available right now.')); setStage('ready'); }
  }

  async function execute() {
    setError(''); setStage('signing');
    try {
      if (!account.evmWallet) throw new Error('Your wallet is still loading. Try again in a moment.');
      setProgress('Getting a fresh quote…');
      const fresh = (await api.swap({ side, symbol, amount })).quote;
      setQuote(fresh);
      if (!fresh.tx) throw new Error('The order could not be prepared.');
      await ensureAllowance({ wallet: account.evmWallet, token: fresh.tokenIn.address, spender: fresh.tx.to, amount: BigInt(fresh.amountIn), onStatus: setProgress,
        review: { title: `Allow ${fresh.tokenIn.symbol} for this order`, rows: [{ label: 'Token', value: fresh.tokenIn.symbol }, { label: 'Exact amount', value: `${fresh.amountInDisplay} ${fresh.tokenIn.symbol}` }], note: 'A one-time approval for exactly this amount, so the order can be filled.', action: 'Approve' } });
      const result = await sendPrepared({ wallet: account.evmWallet, tx: fresh.tx, onStatus: setProgress,
        review: { title: `${side === 'buy' ? 'Buy' : 'Sell'} ${fresh.stock.symbol}`, rows: [
          { label: 'You pay', value: `${fresh.amountInDisplay} ${fresh.tokenIn.symbol}${fresh.amountInUsd != null ? ` (${usd(fresh.amountInUsd)})` : ''}` },
          { label: 'You receive', value: `≈ ${fresh.amountOutDisplay} ${fresh.tokenOut.symbol}` },
          { label: 'Minimum received', value: `${fresh.minOutDisplay} ${fresh.tokenOut.symbol}` }
        ], action: side === 'buy' ? 'Buy' : 'Sell' } });
      setHash(result.hash);
      if (!result.ok) throw new Error('The order failed on-chain. Your tokens did not move (only the network fee was charged).');
      setStage('done');
      void portfolio.refresh();
    } catch (e) {
      console.error('[robank] order failed', e);
      if (e instanceof TxCancelled) { setStage('ready'); return; }
      setError(friendlyError(e, 'The order was not completed.')); setStage('failed');
    }
  }

  return (
    <article className="mk-card swap">
      <div className="mk-head">
        <TokenIcon src={stock?.logo || null} label={symbol} size={40} />
        <div className="mk-title"><b>{side === 'buy' ? 'Buy' : 'Sell'} {symbol}</b><span>{stock?.name || 'Robinhood Stock Token'} · Robinhood Chain</span></div>
        <Badge tone={stage === 'done' ? 'ok' : stage === 'cancelled' ? 'off' : 'pending'}>{stage === 'done' ? 'Completed' : stage === 'cancelled' ? 'Cancelled' : 'Not placed'}</Badge>
      </div>

      <label className="ui-field">
        <span className="ui-label">{side === 'buy' ? 'You spend' : 'You sell'}{held && <em>Available: {held.quantity} {spendSymbol}</em>}</span>
        <div className="ui-input-wrap">
          <input className="ui-input" value={amount} inputMode="decimal" disabled={stage === 'signing' || stage === 'done' || stage === 'cancelled'}
            onChange={(e) => setAmount(e.target.value.replace(',', '.').replace(/[^0-9.]/g, '').slice(0, 24))}
            onBlur={() => { if (amount !== (quote ? quote.amountInDisplay : initialAmount)) void refresh(); }} />
          <span className="ui-input-suffix"><span className="ui-muted" style={{ fontSize: 12 }}>{spendSymbol}</span></span>
        </div>
      </label>

      <div className="ui-kv">
        <div><span>You receive (est.)</span><b>{stage === 'quoting' ? <Spinner /> : quote ? `${quote.amountOutDisplay} ${quote.tokenOut.symbol}` : '—'}</b></div>
        <div><span>Minimum received</span><b>{quote ? `${quote.minOutDisplay} ${quote.tokenOut.symbol}` : '—'}</b></div>
        <div><span>Value</span><b>{quote?.amountOutUsd != null ? usd(quote.amountOutUsd) : '—'}</b></div>
        <div><span>Network fee</span><b>{quote?.gasUsd != null ? `≈ ${usd(quote.gasUsd)} in ETH` : 'Paid in ETH'}</b></div>
        <div><span>Route</span><b>KyberSwap · 1% max slippage</b></div>
      </div>

      {stage === 'signing' && <div className="ui-alert"><Spinner /> <span>{progress}</span></div>}
      {error && <Alert tone="bad">{error}</Alert>}
      {stage === 'done' && <Alert tone="ok">Order completed. {hash && <a className="ui-link" href={explorerTx(ROBINHOOD_CHAIN_ID, hash)} target="_blank" rel="noreferrer">View transaction ↗</a>}</Alert>}

      <div className="mk-actions">
        {stage !== 'done' && stage !== 'cancelled' && <button type="button" className="ui-btn primary sm" disabled={stage === 'signing' || stage === 'quoting' || !quote} onClick={() => void execute()}>{stage === 'signing' ? <><Spinner /> Working…</> : side === 'buy' ? `Buy ${symbol}` : `Sell ${symbol}`}</button>}
        {stage !== 'signing' && stage !== 'done' && stage !== 'cancelled' && <button type="button" className="ui-btn ghost sm" onClick={() => void refresh()}>Refresh quote</button>}
        {stage !== 'signing' && stage !== 'done' && stage !== 'cancelled' && <button type="button" className="ui-btn ghost sm" onClick={() => { setError(''); setStage('cancelled'); }}>Cancel</button>}
      </div>
      <p className="ui-muted" style={{ fontSize: 11 }}>Stock tokens are issued by Robinhood, track the share price and are not shares. You approve the exact amount and sign every step.</p>
    </article>
  );
}
