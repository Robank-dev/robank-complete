'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPublicClient, createWalletClient, custom, fallback, http, parseAbi, type Address, type Hex } from 'viem';
import AppShell from '@/components/AppShell';
import { Alert, Badge, Empty, Skeleton, Spinner, TokenIcon } from '@/components/ui';
import { api } from '@/lib/api';
import { chainById, explorerTx, formatUnits, parseAmount } from '@/lib/chains';
import { friendlyError } from '@/lib/errors';
import { amount as fmtAmount, percent, short, usd } from '@/lib/format';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';
import { roBankEvmChains } from '@/lib/wagmi';
import type { BorrowMarket } from '@/app/api/borrow/route';

const ERC20 = parseAbi(['function approve(address spender, uint256 amount) returns (bool)', 'function allowance(address owner, address spender) view returns (uint256)', 'function balanceOf(address owner) view returns (uint256)']);
const MORPHO = parseAbi([
  'function market(bytes32 id) view returns (uint128 totalSupplyAssets, uint128 totalSupplyShares, uint128 totalBorrowAssets, uint128 totalBorrowShares, uint128 lastUpdate, uint128 fee)',
  'function position(bytes32 id, address user) view returns (uint256 supplyShares, uint128 borrowShares, uint128 collateral)',
  'function supplyCollateral((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams,uint256 assets,address onBehalf,bytes data)',
  'function borrow((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams,uint256 assets,uint256 shares,address onBehalf,address receiver) returns (uint256,uint256)',
  'function repay((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams,uint256 assets,uint256 shares,address onBehalf,bytes data) returns (uint256,uint256)',
  'function withdrawCollateral((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams,uint256 assets,address onBehalf,address receiver)'
]);
const ORACLE = parseAbi(['function price() view returns (uint256)']);
const WAD = BigInt(10) ** BigInt(18);
const ORACLE_SCALE = BigInt(10) ** BigInt(36);
const ZERO = BigInt(0);

type Action = 'supply' | 'borrow' | 'repay' | 'withdraw';
type Chain = { chainId: number; morpho: string; markets: BorrowMarket[] };
type OnChain = { collateral: bigint; borrowShares: bigint; debt: bigint; price: bigint; walletCollateral: bigint; walletLoan: bigint; totalBorrowAssets: bigint; totalBorrowShares: bigint };
type Tx = { label: string; hash?: string; state: 'pending' | 'done' | 'failed' };

const ceilDiv = (a: bigint, b: bigint) => (b === ZERO ? ZERO : (a + b - BigInt(1)) / b);

function BorrowWorkspace() {
  const account = useRobankAccount();
  const [chains, setChains] = useState<Chain[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [chainId, setChainId] = useState(8453);
  const [marketId, setMarketId] = useState('');
  const [query, setQuery] = useState('');
  const [state, setState] = useState<OnChain | null>(null);
  const [stateError, setStateError] = useState('');
  const [action, setAction] = useState<Action>('supply');
  const [input, setInput] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: 'ok' | 'bad' | 'warn'; text: string } | null>(null);
  const lock = useRef(false);

  const load = useCallback(() => {
    setLoadError('');
    api.borrowMarkets().then((d) => setChains(d.networks as Chain[])).catch((e) => setLoadError(friendlyError(e, 'Borrow markets are unavailable right now.')));
  }, []);
  useEffect(load, [load]);

  const chain = chains?.find((c) => c.chainId === chainId);
  const markets = useMemo(() => (chain?.markets || []).filter((m) => !query || `${m.collateral.symbol} ${m.collateral.name} ${m.loan.symbol}`.toLowerCase().includes(query.toLowerCase())), [chain, query]);
  const market = chain?.markets.find((m) => m.marketId === marketId);
  const viemChain = roBankEvmChains.find((c) => c.id === chainId)!;
  const client = useMemo(() => createPublicClient({ chain: viemChain, transport: fallback(chainById(chainId)!.rpcs.map((url) => http(url))) }), [chainId, viemChain]);
  const owner = account.evmAddress as Address | '';

  const readState = useCallback(async () => {
    if (!market || !owner) return;
    setStateError('');
    try {
      const id = market.marketId as Hex;
      const [m, p, price, walletCollateral, walletLoan] = await Promise.all([
        client.readContract({ address: market.morpho as Address, abi: MORPHO, functionName: 'market', args: [id] }),
        client.readContract({ address: market.morpho as Address, abi: MORPHO, functionName: 'position', args: [id, owner] }),
        client.readContract({ address: market.params.oracle as Address, abi: ORACLE, functionName: 'price' }),
        client.readContract({ address: market.params.collateralToken as Address, abi: ERC20, functionName: 'balanceOf', args: [owner] }),
        client.readContract({ address: market.params.loanToken as Address, abi: ERC20, functionName: 'balanceOf', args: [owner] })
      ]);
      const [, , totalBorrowAssets, totalBorrowShares] = m;
      const [, borrowShares, collateral] = p;
      setState({ collateral, borrowShares, debt: ceilDiv(borrowShares * totalBorrowAssets, totalBorrowShares), price, walletCollateral, walletLoan, totalBorrowAssets, totalBorrowShares });
    } catch {
      setState(null);
      setStateError(`Your position on ${chainById(chainId)?.label} could not be read right now.`);
    }
  }, [client, market, owner, chainId]);

  useEffect(() => { setState(null); setInput(''); setReviewing(false); setResult(null); setTxs([]); void readState(); }, [readState]);

  if (loadError) return <Alert tone="bad" title="Markets unavailable." action={<button className="ui-btn secondary sm" onClick={load}>Retry</button>}>{loadError}</Alert>;

  const L = market?.loan;
  const C = market?.collateral;
  const lltv = market ? BigInt(market.params.lltv) : ZERO;
  const maxDebtFor = (collateral: bigint) => (state ? (collateral * state.price / ORACLE_SCALE) * lltv / WAD : ZERO);
  const decimals = action === 'supply' || action === 'withdraw' ? C?.decimals ?? 18 : L?.decimals ?? 6;
  const units = parseAmount(input, decimals);

  let nextCollateral = state?.collateral ?? ZERO;
  let nextDebt = state?.debt ?? ZERO;
  let limit = ZERO;
  let problem = '';
  if (state && market) {
    if (action === 'supply') { limit = state.walletCollateral; if (units) nextCollateral += units; }
    if (action === 'withdraw') {
      const locked = state.debt === ZERO ? ZERO : ceilDiv(state.debt * WAD * ORACLE_SCALE, lltv * state.price) ;
      limit = state.collateral > locked ? (state.collateral - locked) * BigInt(99) / BigInt(100) : ZERO;
      if (state.debt === ZERO) limit = state.collateral;
      if (units) nextCollateral -= units;
    }
    if (action === 'borrow') {
      const headroom = maxDebtFor(state.collateral) - state.debt;
      limit = headroom > ZERO ? headroom * BigInt(95) / BigInt(100) : ZERO; // keep a 5% buffer below liquidation
      if (units) nextDebt += units;
    }
    if (action === 'repay') { limit = state.debt < state.walletLoan ? state.debt : state.walletLoan; if (units) nextDebt = units >= state.debt ? ZERO : state.debt - units; }
    if (input && !units) problem = `Enter a valid amount with at most ${decimals} decimals.`;
    else if (units && units > limit) {
      problem = action === 'supply' ? `You have ${fmtAmount(formatUnits(state.walletCollateral, C!.decimals))} ${C!.symbol} in your wallet.`
        : action === 'borrow' ? (limit === ZERO ? 'Supply collateral first — you have no borrowing capacity yet.' : `You can borrow up to ${fmtAmount(formatUnits(limit, L!.decimals))} ${L!.symbol} while keeping a safety buffer.`)
          : action === 'repay' ? (state.debt === ZERO ? 'You have no debt in this market.' : `You can repay up to ${fmtAmount(formatUnits(limit, L!.decimals))} ${L!.symbol} (your debt or wallet balance, whichever is lower).`)
            : `You can withdraw up to ${fmtAmount(formatUnits(limit, C!.decimals))} ${C!.symbol} without risking liquidation.`;
    }
    if (units && action === 'borrow' && market.liquidityUsd != null && Number(formatUnits(units, L!.decimals)) > market.liquidityUsd) problem = 'The market does not have enough liquidity for this amount.';
  }
  const ltv = (collateral: bigint, debt: bigint) => {
    if (!state || debt === ZERO) return 0;
    const value = collateral * state.price / ORACLE_SCALE;
    return value === ZERO ? Infinity : Number(debt * BigInt(10000) / value) / 100;
  };
  const currentLtv = state ? ltv(state.collateral, state.debt) : 0;
  const nextLtv = state ? ltv(nextCollateral, nextDebt) : 0;
  const repayAll = action === 'repay' && state && units != null && units >= state.debt && state.debt > ZERO;

  async function execute() {
    if (lock.current || !market || !state || !units || !account.evmWallet) return;
    lock.current = true;
    setBusy(true);
    setResult(null);
    const wallet = account.evmWallet;
    const params = { loanToken: market.params.loanToken as Address, collateralToken: market.params.collateralToken as Address, oracle: market.params.oracle as Address, irm: market.params.irm as Address, lltv } as const;
    const list: Tx[] = [];
    const push = (tx: Tx) => { list.push(tx); setTxs([...list]); return list.length - 1; };
    const update = (i: number, patch: Partial<Tx>) => { list[i] = { ...list[i], ...patch }; setTxs([...list]); };
    try {
      await wallet.switchChain(chainId);
      const walletClient = createWalletClient({ account: owner as Address, chain: viemChain, transport: custom(await wallet.getEthereumProvider()) });
      const send = async (label: string, request: Parameters<typeof walletClient.writeContract>[0]) => {
        const i = push({ label, state: 'pending' });
        const hash = await walletClient.writeContract(request);
        update(i, { hash });
        const receipt = await client.waitForTransactionReceipt({ hash, timeout: 150_000 });
        if (receipt.status !== 'success') { update(i, { state: 'failed' }); throw new Error(`${label} failed on-chain.`); }
        update(i, { state: 'done' });
      };
      const approve = async (token: Address, needed: bigint, symbol: string) => {
        const allowance = await client.readContract({ address: token, abi: ERC20, functionName: 'allowance', args: [owner as Address, market.morpho as Address] });
        if (allowance < needed) await send(`Approve ${symbol}`, { account: owner as Address, chain: viemChain, address: token, abi: ERC20, functionName: 'approve', args: [market.morpho as Address, needed] });
      };
      if (action === 'supply') {
        await approve(params.collateralToken, units, C!.symbol);
        await send(`Supply ${C!.symbol}`, { account: owner as Address, chain: viemChain, address: market.morpho as Address, abi: MORPHO, functionName: 'supplyCollateral', args: [params, units, owner as Address, '0x'] });
      } else if (action === 'borrow') {
        await send(`Borrow ${L!.symbol}`, { account: owner as Address, chain: viemChain, address: market.morpho as Address, abi: MORPHO, functionName: 'borrow', args: [params, units, ZERO, owner as Address, owner as Address] });
      } else if (action === 'repay') {
        // Repaying everything uses shares so accrued interest is covered exactly and no dust debt remains.
        const needed = repayAll ? state.debt + state.debt / BigInt(1000) + BigInt(1) : units;
        await approve(params.loanToken, needed, L!.symbol);
        await send(`Repay ${L!.symbol}`, { account: owner as Address, chain: viemChain, address: market.morpho as Address, abi: MORPHO, functionName: 'repay', args: repayAll ? [params, ZERO, state.borrowShares, owner as Address, '0x'] : [params, units, ZERO, owner as Address, '0x'] });
      } else {
        await send(`Withdraw ${C!.symbol}`, { account: owner as Address, chain: viemChain, address: market.morpho as Address, abi: MORPHO, functionName: 'withdrawCollateral', args: [params, units, owner as Address, owner as Address] });
      }
      setResult({ tone: 'ok', text: 'Confirmed on-chain. Your position has been refreshed.' });
      setInput('');
      setReviewing(false);
    } catch (error) {
      const pending = list.find((t) => t.state === 'pending' && t.hash);
      setResult(pending ? { tone: 'warn', text: 'We could not confirm the last transaction yet. Check the explorer link before retrying.' } : { tone: 'bad', text: friendlyError(error) });
    } finally {
      lock.current = false;
      setBusy(false);
      void readState();
    }
  }

  return (
    <div className="ui-grid" style={{ gap: 14 }}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="ui-seg" role="tablist" aria-label="Network">
          {[8453, 4663].map((id) => <button key={id} type="button" role="tab" aria-selected={chainId === id} className={chainId === id ? 'active' : ''} onClick={() => { setChainId(id); setMarketId(''); }}>{chainById(id)!.label}</button>)}
        </div>
        <input className="ui-input" style={{ maxWidth: 260, minHeight: 40 }} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search collateral…" aria-label="Search markets" />
      </div>

      <div className="ui-grid aside">
        <section className="ui-panel tight">
          {!chains ? <div className="ui-grid">{[0, 1, 2, 3].map((i) => <Skeleton key={i} h={44} />)}</div> : !markets.length ? <Empty title="No markets found">{query ? 'Try a different search.' : `Morpho has no listed markets for supported stablecoins on ${chainById(chainId)!.label} right now.`}</Empty> : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead><tr><th>Collateral → Borrow</th><th className="ui-num">Max LTV</th><th className="ui-num">Borrow APY</th><th className="ui-num">Available</th></tr></thead>
                <tbody>
                  {markets.map((m) => (
                    <tr key={m.marketId} className="clickable" onClick={() => setMarketId(m.marketId)} aria-selected={m.marketId === marketId} style={m.marketId === marketId ? { background: 'rgba(255,255,255,.05)' } : undefined}>
                      <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><TokenIcon src={m.collateral.logo} label={m.collateral.symbol} size={28} /><div><b>{m.collateral.symbol}</b><div className="ui-muted" style={{ fontSize: 12 }}>→ {m.loan.symbol}</div></div></div></td>
                      <td className="ui-num">{m.lltvPercent.toFixed(1)}%</td>
                      <td className="ui-num">{percent(m.borrowApy)}</td>
                      <td className="ui-num">{usd(m.liquidityUsd, { compact: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="ui-panel" style={{ alignSelf: 'start' }}>
          {!market ? <Empty title="Choose a market">Pick the asset you want to use as collateral. Rates and liquidity come live from Morpho.</Empty> : (
            <div className="ui-grid" style={{ gap: 14 }}>
              <div className="ui-panel-head" style={{ marginBottom: 0 }}>
                <div><span className="ui-kicker">{chainById(chainId)!.label} · Morpho</span><h2>{C!.symbol} → {L!.symbol}</h2><p className="ui-muted">{C!.name}</p></div>
                <a className="ui-link" href={`https://app.morpho.org/${chainId === 8453 ? 'base' : 'robinhood'}/market/${market.marketId}`} target="_blank" rel="noreferrer">Morpho ↗</a>
              </div>
              {!owner ? <Alert tone="warn">Your wallet is still being prepared.</Alert> : stateError ? <Alert tone="bad" action={<button className="ui-btn secondary sm" onClick={() => void readState()}>Retry</button>}>{stateError}</Alert> : !state ? <Skeleton h={120} /> : (
                <>
                  <div className="ui-grid two" style={{ gap: 10 }}>
                    <div className="ui-stat"><span>Collateral</span><b>{fmtAmount(formatUnits(state.collateral, C!.decimals), 6)}</b><small>{C!.symbol}</small></div>
                    <div className="ui-stat"><span>Debt</span><b>{fmtAmount(formatUnits(state.debt, L!.decimals), 4)}</b><small>{L!.symbol}</small></div>
                    <div className="ui-stat"><span>Loan-to-value</span><b style={{ color: currentLtv > market.lltvPercent * 0.9 ? 'var(--ui-bad)' : undefined }}>{state.debt === ZERO ? '0%' : `${currentLtv.toFixed(2)}%`}</b><small>Liquidation at {market.lltvPercent.toFixed(1)}%</small></div>
                    <div className="ui-stat"><span>Borrow APY</span><b>{percent(market.borrowApy)}</b><small>Variable</small></div>
                  </div>
                  <div className="ui-seg" role="tablist" aria-label="Action">
                    {(['supply', 'borrow', 'repay', 'withdraw'] as Action[]).map((a) => <button key={a} type="button" role="tab" aria-selected={action === a} className={action === a ? 'active' : ''} disabled={busy} onClick={() => { setAction(a); setInput(''); setReviewing(false); setResult(null); }}>{a === 'supply' ? 'Supply collateral' : a[0].toUpperCase() + a.slice(1)}</button>)}
                  </div>
                  <label className="ui-field">
                    <span className="ui-label">Amount <em>{action === 'supply' ? `Wallet: ${fmtAmount(formatUnits(state.walletCollateral, C!.decimals), 6)} ${C!.symbol}` : action === 'repay' ? `Wallet: ${fmtAmount(formatUnits(state.walletLoan, L!.decimals), 4)} ${L!.symbol}` : `Up to ${fmtAmount(formatUnits(limit, decimals), 6)}`}</em></span>
                    <div className="ui-input-wrap">
                      <input className={`ui-input${problem ? ' invalid' : ''}`} value={input} inputMode="decimal" placeholder="0.00" disabled={busy} onChange={(e) => { setInput(e.target.value.replace(',', '.').replace(/[^0-9.]/g, '').slice(0, 32)); setReviewing(false); }} />
                      <span className="ui-input-suffix">{limit > ZERO && <button type="button" className="ui-btn ghost sm" disabled={busy} onClick={() => setInput(formatUnits(limit, decimals))}>Max</button>}<span className="ui-muted" style={{ fontSize: 12 }}>{action === 'supply' || action === 'withdraw' ? C!.symbol : L!.symbol}</span></span>
                    </div>
                  </label>
                  {problem && <p className="ui-hint bad">{problem}</p>}
                  {units && !problem && (
                    <div className="ui-kv">
                      <div><span>Loan-to-value after</span><b style={{ color: nextLtv > market.lltvPercent * 0.9 ? 'var(--ui-warn)' : undefined }}>{nextDebt === ZERO ? '0%' : `${nextLtv.toFixed(2)}%`}</b></div>
                      <div><span>Debt after</span><b>{fmtAmount(formatUnits(nextDebt, L!.decimals), 4)} {L!.symbol}</b></div>
                      <div><span>Collateral after</span><b>{fmtAmount(formatUnits(nextCollateral, C!.decimals), 6)} {C!.symbol}</b></div>
                      {repayAll && <div><span>Repay mode</span><b>Full repayment (clears accrued interest)</b></div>}
                    </div>
                  )}
                  {action === 'borrow' && units && !problem && nextLtv > market.lltvPercent * 0.85 && <Alert tone="warn">This is close to the liquidation threshold. A small price move could liquidate part of your collateral.</Alert>}
                  {!reviewing ? (
                    <button type="button" className="ui-btn primary block" disabled={!units || Boolean(problem) || busy} onClick={() => setReviewing(true)}>Review</button>
                  ) : (
                    <div className="ui-grid" style={{ gap: 10 }}>
                      <Alert tone="warn">You will sign {action === 'borrow' || action === 'withdraw' ? 'one transaction' : 'an approval (if needed) and one transaction'} on {chainById(chainId)!.label}. Network fees are paid in ETH.</Alert>
                      <div style={{ display: 'flex', gap: 10 }}><button type="button" className="ui-btn primary" disabled={busy} onClick={() => void execute()}>{busy ? <><Spinner /> Working…</> : 'Confirm & sign'}</button><button type="button" className="ui-btn ghost" disabled={busy} onClick={() => setReviewing(false)}>Edit</button></div>
                    </div>
                  )}
                  {txs.length > 0 && <div className="ui-steps">{txs.map((t, i) => <div key={i} className={`ui-step ${t.state === 'done' ? 'done' : t.state === 'failed' ? 'failed' : 'active'}`}><i>{t.state === 'done' ? '✓' : t.state === 'failed' ? '!' : i + 1}</i><span>{t.label}{t.hash && <> · <a className="ui-link" href={explorerTx(chainId, t.hash)} target="_blank" rel="noreferrer">{short(t.hash, 8, 6)} ↗</a></>}{t.state === 'pending' && !t.hash && ' — confirm in your wallet'}</span></div>)}</div>}
                  {result && <Alert tone={result.tone}>{result.text}</Alert>}
                </>
              )}
            </div>
          )}
        </section>
      </div>
      <Alert tone="info" title="How borrowing works.">You keep custody: collateral sits in the Morpho protocol contract, not with ROBANK. If your loan-to-value reaches the market&apos;s liquidation threshold, part of your collateral can be sold to repay the debt. Rates are variable and set by the market.</Alert>
      <p className="ui-muted">Solana lending (Kamino) is not integrated in ROBANK. <a className="ui-link" href="https://app.kamino.finance/" target="_blank" rel="noreferrer">Open Kamino ↗</a> to use it directly with your own wallet.</p>
    </div>
  );
}

export default function BorrowPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">Borrow</span><h1>Borrow against your assets</h1><p>Use crypto collateral to borrow USDC or USDG through Morpho on Base and Robinhood Chain. Every step is signed in your own wallet.</p></div><Badge tone="live">Live · Morpho</Badge></header>
        <BorrowWorkspace />
      </div>
    </AppShell>
  );
}
