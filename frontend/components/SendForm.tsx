'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createPublicClient, createWalletClient, custom, encodeFunctionData, fallback, http } from 'viem';
import { useSignAndSendTransaction } from '@privy-io/react-auth/solana';
import { convertQuoteToRoute, executeRoute } from '@lifi/sdk';
import { api } from '@/lib/api';
import { CHAINS, NATIVE_LOGOS, SOLANA_CHAIN_ID, STABLECOINS, STABLE_META, chainById, chainByKey, explorerTx, formatUnits, isAddressFor, parseAmount, stablecoin, type StableSymbol } from '@/lib/chains';
import { friendlyError } from '@/lib/errors';
import { amount as fmtAmount, short, usd } from '@/lib/format';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';
import { usePortfolio } from '@/lib/hooks/usePortfolio';
import { createRobankLifiClient } from '@/lib/lifi';
import { buildSolanaTransfer, signatureToString, waitForSolanaSignature } from '@/lib/solanaTransfer';
import { roBankEvmChains } from '@/lib/wagmi';
import type { Holding } from '@/lib/server/portfolio';
import { Alert, Badge, Picker, Spinner, type PickerOption } from './ui';

type AssetKind = 'stable' | 'native' | 'token';
type AssetChoice = { id: string; kind: AssetKind; symbol: string; name: string; logo: string; chainIds: number[]; holding?: Holding };
type Phase = 'form' | 'review' | 'signing' | 'submitted' | 'confirmed' | 'failed' | 'unknown';
type Quote = { quote: any; at: number; key: string };

const ERC20_TRANSFER = [{ type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }] as const;
const QUOTE_TTL_MS = 45_000;

function sourceId(chainId: number) {
  return chainId === SOLANA_CHAIN_ID ? 'solana' : `evm:${chainId}`;
}

export default function SendForm() {
  const params = useSearchParams();
  const account = useRobankAccount();
  const portfolio = usePortfolio(account.user?.id || '');
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [assetId, setAssetId] = useState('stable:USDC');
  const [fromChain, setFromChain] = useState(8453);
  const [toChain, setToChain] = useState(8453);
  const [recipient, setRecipient] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [phase, setPhase] = useState<Phase>('form');
  const [progress, setProgress] = useState('');
  const [txHash, setTxHash] = useState<{ chainId: number; hash: string; link?: string } | null>(null);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const prefilled = useRef(false);

  const holdings = portfolio.data?.holdings || [];
  const sources = portfolio.data?.sources || [];

  const assets = useMemo<AssetChoice[]>(() => {
    const list: AssetChoice[] = (['USDC', 'USDT', 'USDG'] as StableSymbol[]).map((symbol) => ({
      id: `stable:${symbol}`, kind: 'stable', symbol, name: STABLE_META[symbol].name, logo: STABLE_META[symbol].logo,
      chainIds: STABLECOINS.filter((t) => t.symbol === symbol).map((t) => t.chainId)
    }));
    for (const symbol of ['ETH', 'SOL', 'BNB', 'POL']) {
      list.push({ id: `native:${symbol}`, kind: 'native', symbol, name: symbol === 'ETH' ? 'Ether' : symbol === 'SOL' ? 'Solana' : symbol, logo: NATIVE_LOGOS[symbol], chainIds: CHAINS.filter((c) => c.native.symbol === symbol).map((c) => c.id) });
    }
    for (const h of holdings) {
      if (h.kind !== 'xstock' && h.kind !== 'stock-token') continue;
      list.push({ id: `token:${h.chainId}:${h.contract}`, kind: 'token', symbol: h.symbol, name: h.name, logo: h.logo, chainIds: [h.chainId], holding: h });
    }
    return list;
  }, [holdings]);

  const asset = assets.find((a) => a.id === assetId) || assets[0];

  const balanceOf = (chainId: number): { raw: bigint; known: boolean } => {
    const ok = sources.some((s) => s.id === sourceId(chainId) && s.ok);
    const match = holdings.find((h) => h.chainId === chainId && (
      asset.kind === 'stable' ? h.kind === 'stablecoin' && h.symbol === asset.symbol
        : asset.kind === 'native' ? h.kind === 'native'
          : h.contract === asset.holding?.contract));
    return { raw: match ? BigInt(match.raw) : BigInt(0), known: Boolean(portfolio.data) && (ok || Boolean(match)) };
  };

  const decimals = asset.kind === 'stable' ? stablecoin(fromChain, asset.symbol)?.decimals ?? 6
    : asset.kind === 'native' ? chainById(fromChain)?.native.decimals ?? 18
      : asset.holding?.decimals ?? 18;

  // Keep networks consistent with the selected asset.
  useEffect(() => {
    if (!asset.chainIds.includes(fromChain)) {
      const held = asset.chainIds.find((id) => balanceOf(id).raw > BigInt(0));
      setFromChain(held ?? asset.chainIds[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.id]);
  useEffect(() => {
    if (asset.kind !== 'stable' || !asset.chainIds.includes(toChain)) setToChain(fromChain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromChain, asset.id]);

  // Prefill from a link (e.g. prepared by the agent). Applied once; the user still reviews everything.
  useEffect(() => {
    if (prefilled.current || !params) return;
    const symbol = (params.get('asset') || '').toUpperCase();
    const chain = chainByKey(params.get('chain'));
    if (!symbol && !params.get('to')) { prefilled.current = true; return; }
    const match = assets.find((a) => a.symbol.toUpperCase() === symbol && (!chain || a.chainIds.includes(chain.id)));
    if (symbol && !match && !portfolio.data && !portfolio.error) return; // wait for held tokens to load
    prefilled.current = true;
    if (match) setAssetId(match.id);
    if (chain && (!match || match.chainIds.includes(chain.id))) { setFromChain(chain.id); setToChain(chain.id); }
    const to = params.get('to');
    if (to && to.length <= 64) setRecipient(to.trim());
    const amt = params.get('amount');
    if (amt && /^\d+(\.\d+)?$/.test(amt)) setAmountInput(amt);
  }, [assets, params, portfolio.data]);

  const from = chainById(fromChain)!;
  const to = chainById(toChain)!;
  const crossChain = fromChain !== toChain;
  const units = parseAmount(amountInput, decimals);
  const balance = balanceOf(fromChain);
  const nativeBalance = holdings.find((h) => h.chainId === fromChain && h.kind === 'native');
  const recipientTrim = recipient.trim();
  const recipientValid = isAddressFor(toChain, recipientTrim);
  const ownAddress = (to.type === 'solana' ? account.solanaAddress : account.evmAddress) || '';
  const sendingToSelf = recipientValid && recipientTrim.toLowerCase() === ownAddress.toLowerCase() && !crossChain;
  const sourceAddress = from.type === 'solana' ? account.solanaAddress : account.evmAddress;

  const issues: string[] = [];
  if (amountInput && !units) issues.push(`Enter a valid amount with at most ${decimals} decimals.`);
  if (units && balance.known && units > balance.raw) issues.push(`You only have ${fmtAmount(formatUnits(balance.raw, decimals))} ${asset.symbol} on ${from.label}.`);
  if (recipientTrim && !recipientValid) issues.push(`This is not a valid ${to.label} address.`);
  if (sendingToSelf) issues.push('This is your own address on the same network.');
  const warnings: string[] = [];
  if (balance.known && asset.kind !== 'native' && portfolio.data && (!nativeBalance || BigInt(nativeBalance.raw) === BigInt(0))) {
    warnings.push(`You have no ${from.native.symbol} on ${from.label} to pay the network fee. The transfer will fail until you add some.`);
  }
  if (!balance.known && portfolio.data) warnings.push(`Your ${from.label} balance could not be checked right now. Your wallet will still refuse a transfer you cannot afford.`);
  if (asset.kind === 'native' && units && balance.known && units === balance.raw) warnings.push(`Leave some ${asset.symbol} for the network fee.`);

  const sourceToken = asset.kind === 'stable' ? stablecoin(fromChain, asset.symbol) : undefined;
  const destToken = asset.kind === 'stable' ? stablecoin(toChain, asset.symbol) : undefined;
  const quoteKey = crossChain && units && recipientValid && sourceToken && destToken ? `${fromChain}:${toChain}:${sourceToken.address}:${recipientTrim}:${units}` : '';

  useEffect(() => {
    if (!quoteKey) { setQuote(null); setQuoteError(''); setQuoteLoading(false); return; }
    let active = true;
    setQuoteLoading(true);
    setQuoteError('');
    const timer = window.setTimeout(async () => {
      try {
        const result = await api.lifiQuote({ fromChain, toChain, fromToken: sourceToken!.address, toToken: destToken!.address, toAddress: recipientTrim, amount: units!.toString(), mode: 'fromAmount' });
        if (active) setQuote({ quote: result.quote, at: Date.now(), key: quoteKey });
      } catch (err) {
        if (active) { setQuote(null); setQuoteError(friendlyError(err, 'No route is available right now.')); }
      } finally {
        if (active) setQuoteLoading(false);
      }
    }, 500);
    return () => { active = false; window.clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey]);

  const quoteReady = !crossChain || (quote && quote.key === quoteKey);
  const canReview = Boolean(account.authenticated && sourceAddress && units && recipientValid && !issues.length && quoteReady && !quoteLoading);

  const estimate = quote?.quote?.estimate;
  const receiveText = crossChain
    ? estimate?.toAmount && destToken ? `${fmtAmount(formatUnits(BigInt(estimate.toAmount), destToken.decimals))} ${asset.symbol}` : '—'
    : units ? `${fmtAmount(amountInput)} ${asset.symbol}` : '—';
  const minReceive = crossChain && estimate?.toAmountMin && destToken ? `${fmtAmount(formatUnits(BigInt(estimate.toAmountMin), destToken.decimals))} ${asset.symbol}` : '';
  const feeUsd = crossChain && estimate ? [...(estimate.feeCosts || []), ...(estimate.gasCosts || [])].reduce((s: number, c: any) => s + Number(c?.amountUSD || 0), 0) : null;
  const eta = crossChain && estimate?.executionDuration ? Math.max(1, Math.round(Number(estimate.executionDuration) / 60)) : null;

  function reset() {
    setPhase('form'); setTxHash(null); setError(''); setProgress(''); setAmountInput(''); setQuote(null);
    lock.current = false;
  }

  async function execute() {
    if (lock.current || !units) return;
    if (crossChain && quote && Date.now() - quote.at > QUOTE_TTL_MS) {
      setError('The route quote expired. Review the refreshed quote before signing.');
      setQuote(null);
      setPhase('form');
      return;
    }
    lock.current = true;
    setError('');
    setPhase('signing');
    try {
      if (crossChain) {
        const { evmWallet, solanaWallet } = account;
        const client = createRobankLifiClient({ evmWallet, solanaWallet, currentEvmChainId: from.type === 'evm' ? fromChain : 8453 });
        setProgress('Confirm the transfer in your wallet…');
        await executeRoute(client, convertQuoteToRoute(quote!.quote), {
          executeInBackground: false,
          updateRouteHook(route) {
            for (const step of route.steps) {
              for (const process of step.execution?.actions || []) {
                if (process.txHash && process.chainId === fromChain) {
                  setTxHash({ chainId: fromChain, hash: process.txHash, link: process.txLink });
                  setPhase('submitted');
                  setProgress(`Submitted on ${from.label}. Waiting for delivery on ${to.label}…`);
                }
              }
            }
          }
        });
        setPhase('confirmed');
      } else if (from.type === 'evm') {
        const wallet = account.evmWallet;
        if (!wallet) throw new Error('Your EVM wallet is still loading. Try again in a moment.');
        const chain = roBankEvmChains.find((c) => c.id === fromChain)!;
        setProgress(`Switching your wallet to ${from.label}…`);
        await wallet.switchChain(fromChain);
        const provider = await wallet.getEthereumProvider();
        const walletClient = createWalletClient({ account: wallet.address as `0x${string}`, chain, transport: custom(provider) });
        setProgress('Confirm the transfer in your wallet…');
        const hash = asset.kind === 'native'
          ? await walletClient.sendTransaction({ account: wallet.address as `0x${string}`, chain, to: recipientTrim as `0x${string}`, value: units })
          : await walletClient.sendTransaction({ account: wallet.address as `0x${string}`, chain, to: (sourceToken?.address || asset.holding?.contract) as `0x${string}`, data: encodeFunctionData({ abi: ERC20_TRANSFER, functionName: 'transfer', args: [recipientTrim as `0x${string}`, units] }) });
        setTxHash({ chainId: fromChain, hash });
        setPhase('submitted');
        setProgress(`Submitted. Waiting for confirmation on ${from.label}…`);
        const publicClient = createPublicClient({ chain, transport: fallback(from.rpcs.map((url) => http(url))) });
        try {
          const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 150_000 });
          if (receipt.status === 'success') setPhase('confirmed');
          else { setPhase('failed'); setError('The transaction was included but failed on-chain. Your funds did not move (only the network fee was charged).'); }
        } catch {
          setPhase('unknown');
        }
      } else {
        const wallet = account.solanaWallet;
        if (!wallet || !account.solanaAddress) throw new Error('Your Solana wallet is still loading. Try again in a moment.');
        const token = asset.kind === 'stable' ? sourceToken : undefined;
        const mint = token?.address || (asset.kind === 'token' ? asset.holding?.contract || undefined : undefined);
        const programId = token?.programId || (asset.kind === 'token' ? 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb' : undefined);
        setProgress('Preparing the Solana transaction…');
        const transaction = await buildSolanaTransfer({ from: account.solanaAddress, to: recipientTrim, amount: units, mint, decimals, programId });
        setProgress('Confirm the transfer in your wallet…');
        const { signature } = await signAndSendTransaction({ transaction, wallet: wallet as any, chain: 'solana:mainnet' });
        const hash = signatureToString(signature);
        setTxHash({ chainId: SOLANA_CHAIN_ID, hash });
        setPhase('submitted');
        setProgress('Submitted. Waiting for confirmation on Solana…');
        const status = await waitForSolanaSignature(hash);
        if (status === 'confirmed') setPhase('confirmed');
        else if (status === 'failed') { setPhase('failed'); setError('The transaction failed on-chain. Your tokens did not move.'); }
        else setPhase('unknown');
      }
      void portfolio.refresh();
    } catch (err) {
      const message = friendlyError(err);
      setError(message);
      setPhase((current) => (current === 'submitted' ? 'unknown' : 'failed'));
    } finally {
      lock.current = false;
    }
  }

  const assetOptions: PickerOption[] = assets.map((a) => {
    const total = holdings.filter((h) => a.kind === 'stable' ? h.kind === 'stablecoin' && h.symbol === a.symbol : a.kind === 'native' ? h.kind === 'native' && h.symbol === a.symbol : h.id === a.holding?.id)
      .reduce((s, h) => s + (h.valueUsd ?? 0), 0);
    return { id: a.id, label: a.symbol, sub: a.kind === 'token' ? `${a.name} · ${chainById(a.chainIds[0])?.label}` : a.name, image: a.logo, chainId: a.kind === 'token' ? a.chainIds[0] : undefined, value: total > 0 ? usd(total) : undefined };
  });
  const chainOption = (id: number, withBalance: boolean): PickerOption => {
    const c = chainById(id)!;
    const b = withBalance ? balanceOf(id) : null;
    const dec = asset.kind === 'stable' ? stablecoin(id, asset.symbol)?.decimals ?? 6 : asset.kind === 'native' ? c.native.decimals : decimals;
    return { id: String(id), label: c.label, image: c.icon, value: b && b.raw > BigInt(0) ? `${fmtAmount(formatUnits(b.raw, dec), 4)} ${asset.symbol}` : undefined };
  };
  const fromOptions = asset.chainIds.map((id) => chainOption(id, true));
  const toOptions = (asset.kind === 'stable' ? asset.chainIds : [fromChain]).map((id) => chainOption(id, false));

  const busy = phase === 'signing' || phase === 'submitted';
  const explorer = txHash ? txHash.link || explorerTx(txHash.chainId, txHash.hash) : '';

  if (phase !== 'form' && phase !== 'review') {
    const title = phase === 'confirmed' ? (crossChain ? 'Transfer delivered' : 'Transfer confirmed')
      : phase === 'failed' ? 'Transfer not completed'
        : phase === 'unknown' ? 'Still pending'
          : phase === 'submitted' ? 'Transfer submitted' : 'Waiting for your approval';
    return (
      <section className="ui-panel" aria-live="polite">
        <div className="ui-panel-head">
          <div><span className="ui-kicker">SEND</span><h2>{title}</h2></div>
          <Badge tone={phase === 'confirmed' ? 'ok' : phase === 'failed' ? 'bad' : 'pending'}>{phase === 'confirmed' ? 'Confirmed' : phase === 'failed' ? 'Failed' : phase === 'unknown' ? 'Unconfirmed' : 'In progress'}</Badge>
        </div>
        <div className="ui-kv">
          <div><span>Amount</span><b>{fmtAmount(amountInput)} {asset.symbol}</b></div>
          <div><span>From</span><b>{from.label}</b></div>
          <div><span>To</span><b>{to.label} · <span className="ui-mono">{short(recipientTrim, 8, 6)}</span></b></div>
          {txHash && <div><span>Transaction</span><b><a className="ui-link" href={explorer} target="_blank" rel="noreferrer">{short(txHash.hash, 10, 8)} ↗</a></b></div>}
        </div>
        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          {busy && <div className="ui-alert"><Spinner /> <span>{progress || 'Working…'} Keep this page open.</span></div>}
          {phase === 'confirmed' && <Alert tone="ok">{crossChain ? `The recipient has received the funds on ${to.label}.` : 'The transfer is final on-chain.'}</Alert>}
          {phase === 'unknown' && <Alert tone="warn" title="We could not confirm the result yet.">{txHash ? 'Check the explorer link before trying again so you do not send twice.' : error || 'Check your wallet activity before trying again.'}</Alert>}
          {phase === 'failed' && <Alert tone="bad">{error || 'Nothing was sent.'}</Alert>}
          {!busy && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button type="button" className="ui-btn primary" onClick={reset}>New transfer</button><Link href="/dashboard" className="ui-btn ghost">Back to Overview</Link></div>}
        </div>
      </section>
    );
  }

  if (phase === 'review') {
    return (
      <section className="ui-panel">
        <div className="ui-panel-head"><div><span className="ui-kicker">REVIEW</span><h2>Check before you sign.</h2></div></div>
        <div className="ui-kv">
          <div><span>You send</span><b>{fmtAmount(amountInput)} {asset.symbol} on {from.label}</b></div>
          <div><span>Recipient gets</span><b>{receiveText}{crossChain ? ' (estimated)' : ''}</b></div>
          {minReceive && <div><span>Minimum received</span><b>{minReceive}</b></div>}
          <div><span>Destination network</span><b>{to.label}</b></div>
          <div><span>Recipient</span><b className="ui-mono">{recipientTrim}</b></div>
          <div><span>Network fee</span><b>{crossChain ? (feeUsd != null ? `≈ ${usd(feeUsd)} (route + gas)` : '—') : `Paid in ${from.native.symbol}, shown in your wallet`}</b></div>
          {eta && <div><span>Estimated time</span><b>~{eta} min</b></div>}
          {crossChain && <div><span>Route</span><b>LI.FI · {quote?.quote?.toolDetails?.name || quote?.quote?.tool || 'best route'}</b></div>}
        </div>
        <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
          <Alert tone="warn">Blockchain transfers cannot be reversed. Make sure the address belongs to the recipient on <b>{to.label}</b>.</Alert>
          {error && <Alert tone="bad">{error}</Alert>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="ui-btn primary" onClick={() => void execute()} disabled={lock.current}>Confirm & sign</button>
            <button type="button" className="ui-btn ghost" onClick={() => { setPhase('form'); setError(''); }}>Edit</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="ui-panel">
      <div className="ui-grid two">
        <Picker label="Asset" value={assetOptions.find((o) => o.id === asset.id)} options={assetOptions} onChange={(o) => { setAssetId(o.id); setAmountInput(''); }} />
        <Picker label="From network" value={fromOptions.find((o) => o.id === String(fromChain))} options={fromOptions} onChange={(o) => setFromChain(Number(o.id))} search={false} />
      </div>

      <div className="ui-grid two" style={{ marginTop: 14 }}>
        <label className="ui-field">
          <span className="ui-label">Recipient address</span>
          <input className={`ui-input${recipientTrim && !recipientValid ? ' invalid' : ''}`} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder={to.type === 'solana' ? 'Solana address' : '0x…'} spellCheck={false} autoComplete="off" autoCapitalize="off" maxLength={64} />
        </label>
        <Picker label="To network" value={toOptions.find((o) => o.id === String(toChain))} options={toOptions} onChange={(o) => setToChain(Number(o.id))} search={false} disabled={toOptions.length < 2} />
      </div>

      <label className="ui-field" style={{ marginTop: 14 }}>
        <span className="ui-label">Amount <em>{balance.known ? `Available: ${fmtAmount(formatUnits(balance.raw, decimals))} ${asset.symbol}` : portfolio.loading ? 'Checking balance…' : ''}</em></span>
        <div className="ui-input-wrap">
          <input className={`ui-input${amountInput && !units ? ' invalid' : ''}`} value={amountInput} onChange={(e) => setAmountInput(e.target.value.replace(',', '.').replace(/[^0-9.]/g, '').slice(0, 32))} placeholder="0.00" inputMode="decimal" autoComplete="off" />
          <span className="ui-input-suffix">
            {asset.kind !== 'native' && balance.raw > BigInt(0) && <button type="button" className="ui-btn ghost sm" onClick={() => setAmountInput(formatUnits(balance.raw, decimals))}>Max</button>}
            <span className="ui-muted" style={{ fontSize: 12 }}>{asset.symbol}</span>
          </span>
        </div>
      </label>

      {crossChain && (
        <div className="ui-kv" style={{ marginTop: 14 }}>
          <div><span>Route</span><b>{from.label} → {to.label} via LI.FI</b></div>
          <div><span>Recipient gets</span><b>{quoteLoading ? 'Finding the best route…' : receiveText}</b></div>
          {feeUsd != null && <div><span>Fees</span><b>≈ {usd(feeUsd)}</b></div>}
        </div>
      )}

      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        {issues.map((issue) => <p key={issue} className="ui-hint bad">{issue}</p>)}
        {quoteError && <p className="ui-hint bad">{quoteError}</p>}
        {warnings.map((w) => <p key={w} className="ui-hint warn">{w}</p>)}
        {!account.evmAddress && !account.solanaAddress && <Alert tone="warn">Your wallets are still being prepared. This usually takes a few seconds after sign-in.</Alert>}
        <button type="button" className="ui-btn primary block" disabled={!canReview} onClick={() => { setError(''); setPhase('review'); }}>
          {quoteLoading ? <><Spinner /> Finding route…</> : 'Review transfer'}
        </button>
        <p className="ui-muted" style={{ textAlign: 'center' }}>Bank payouts are not available yet. Transfers go to on-chain addresses only.</p>
      </div>
    </section>
  );
}
