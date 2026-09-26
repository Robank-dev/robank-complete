'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createPublicClient, createWalletClient, custom, http, parseAbi, parseUnits, formatUnits, type Address } from 'viem';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { roBankEvmChains } from '@/lib/wagmi';

type Market = {
  chainId: number;
  network: string;
  provider: string;
  morphoAddress: string;
  marketId: string;
  params: { loanToken: string; collateralToken: string; oracle: string; irm: string; lltv: string };
  loanAsset: string;
  collateralAsset: string;
  collateralName: string;
  collateralDecimals: number;
  lltv: number;
  supplied: number | null;
  borrowed: number | null;
  liquidity: number | null;
  borrowApy: number | null;
  supplyApy: number | null;
  url: string;
};

type Network = {
  id: number;
  key: string;
  name: string;
  type: 'evm' | 'solana';
  provider: string;
  morphoAddress: string | null;
  markets: Market[];
  appUrl: string;
  notice?: string;
  error?: string;
};

type Position = {
  collateral: number;
  borrow: number;
};

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)'
]);

const MORPHO_ABI = parseAbi([
  'function supplyCollateral((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams,uint256 assets,address onBehalf,bytes data)',
  'function borrow((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams,uint256 assets,uint256 shares,address onBehalf,address receiver)',
  'function repay((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams,uint256 assets,uint256 shares,address onBehalf,bytes data)',
  'function withdrawCollateral((address loanToken,address collateralToken,address oracle,address irm,uint256 lltv) marketParams,uint256 assets,address onBehalf,address receiver)'
]);

function money(value: number | null) {
  if (value == null || !Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B';
  if (Math.abs(value) >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M';
  if (Math.abs(value) >= 1e3) return '$' + (value / 1e3).toFixed(2) + 'K';
  return '$' + value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function percent(value: number | null) {
  return value == null || !Number.isFinite(value) ? '—' : (value * 100).toFixed(2) + '%';
}

function chainLabel(id: number) {
  return id === 8453 ? 'Base' : id === 4663 ? 'Robinhood Chain' : String(id);
}

export default function BorrowPage() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const evmWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
  const address = evmWallet?.address || '';

  const [networks, setNetworks] = useState<Network[]>([]);
  const [networkKey, setNetworkKey] = useState<'base' | 'robinhood' | 'solana'>('base');
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [collateralBalance, setCollateralBalance] = useState<number | null>(null);
  const [position, setPosition] = useState<Position>({ collateral: 0, borrow: 0 });
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.borrowMarkets()
      .then((data) => {
        const list = (data.networks || []) as Network[];
        setNetworks(list);
        const base = list.find((item) => item.key === 'base' && item.markets.length);
        if (base) {
          setNetworkKey('base');
          setSelectedMarketId(base.markets[0].marketId);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Borrow markets unavailable.'))
      .finally(() => setLoading(false));
  }, []);

  const network = networks.find((item) => item.key === networkKey);
  const markets = useMemo(() => network?.markets || [], [network]);
  const selectedMarket = markets.find((market) => market.marketId === selectedMarketId) || markets[0];

  useEffect(() => {
    if (markets.length && !markets.some((market) => market.marketId === selectedMarketId)) {
      setSelectedMarketId(markets[0].marketId);
    }
  }, [markets, selectedMarketId]);

  useEffect(() => {
    setCollateralBalance(null);
    setPosition({ collateral: 0, borrow: 0 });
    if (!selectedMarket || !address || selectedMarket.chainId === 1151111081099710) return;

    let cancelled = false;
    async function readState() {
      try {
        const chain = roBankEvmChains.find((item) => item.id === selectedMarket!.chainId);
        if (!chain) return;
        const client = createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0]) });
        const [balanceRaw, pos] = await Promise.all([
          client.readContract({
            address: selectedMarket!.params.collateralToken as Address,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address as Address]
          }),
          fetch('/api/borrow?position=1&chainId=' + selectedMarket!.chainId + '&marketId=' + encodeURIComponent(selectedMarket!.marketId) + '&address=' + encodeURIComponent(address) + '&decimals=' + selectedMarket!.collateralDecimals)
            .then((response) => response.json())
        ]);
        if (cancelled) return;
        setCollateralBalance(Number(formatUnits(balanceRaw, selectedMarket!.collateralDecimals)));
        setPosition({
          collateral: Number(pos?.position?.collateral || 0),
          borrow: Number(pos?.position?.borrow || 0)
        });
      } catch {
        if (!cancelled) {
          setCollateralBalance(null);
          setPosition({ collateral: 0, borrow: 0 });
        }
      }
    }
    void readState();
    return () => { cancelled = true; };
  }, [address, selectedMarket]);

  async function execute(action: 'borrow' | 'repay' | 'withdraw') {
    if (!authenticated) return setError('Sign in with email first.');
    if (!evmWallet || !address || !selectedMarket) return setError('Embedded EVM wallet is not ready.');
    if (selectedMarket.chainId === 1151111081099710) return setError('Solana borrowing uses provider handoff and is not an EVM transaction.');

    const chain = roBankEvmChains.find((item) => item.id === selectedMarket!.chainId);
    if (!chain) return setError('Network is not configured in ROBANK.');
    if (!selectedMarket.params.loanToken || !selectedMarket.params.collateralToken || !selectedMarket.params.oracle || !selectedMarket.params.irm) {
      return setError('This market is missing immutable Morpho parameters.');
    }

    const amountText = action === 'borrow' ? borrowAmount : action === 'repay' ? repayAmount : withdrawAmount;
    if (!amountText || Number(amountText) <= 0) return setError('Enter an amount first.');
    if (action === 'withdraw' && Number(amountText) > position.collateral) return setError('Withdraw amount exceeds your current collateral.');
    if (action === 'repay' && Number(amountText) > position.borrow + 1e-12) return setError('Repay amount exceeds your current debt.');

    setBusy(true);
    setError('');
    setStatus('Preparing secure wallet approval…');

    try {
      await evmWallet.switchChain(selectedMarket.chainId);
      const provider = await evmWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        account: address as Address,
        chain,
        transport: custom(provider)
      });
      const publicClient = createPublicClient({
        chain,
        transport: http(chain.rpcUrls.default.http[0])
      });

      const marketParams = {
        loanToken: selectedMarket.params.loanToken as Address,
        collateralToken: selectedMarket.params.collateralToken as Address,
        oracle: selectedMarket.params.oracle as Address,
        irm: selectedMarket.params.irm as Address,
        lltv: BigInt(selectedMarket.params.lltv)
      } as const;

      if (action === 'borrow') {
        const collateral = parseUnits(collateralAmount || '0', selectedMarket.collateralDecimals);
        const borrow = parseUnits(borrowAmount, 6);

        if (collateral <= BigInt(0)) return setError('Enter collateral amount first.');

        setStatus('Checking collateral allowance…');
        const allowance = await publicClient.readContract({
          address: marketParams.collateralToken,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address as Address, selectedMarket.morphoAddress as Address]
        });

        if (allowance < collateral) {
          setStatus('Approve collateral token…');
          const approveHash = await walletClient.writeContract({
            account: address as Address,
            chain,
            address: marketParams.collateralToken,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [selectedMarket.morphoAddress as Address, collateral]
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        setStatus('Supplying collateral to Morpho…');
        const supplyHash = await walletClient.writeContract({
          account: address as Address,
          chain,
          address: selectedMarket.morphoAddress as Address,
          abi: MORPHO_ABI,
          functionName: 'supplyCollateral',
          args: [marketParams, collateral, address as Address, '0x']
        });
        await publicClient.waitForTransactionReceipt({ hash: supplyHash });

        setStatus('Borrowing ' + selectedMarket.loanAsset + '…');
        const borrowHash = await walletClient.writeContract({
          account: address as Address,
          chain,
          address: selectedMarket.morphoAddress as Address,
          abi: MORPHO_ABI,
          functionName: 'borrow',
          args: [marketParams, borrow, BigInt(0), address as Address, address as Address]
        });
        await publicClient.waitForTransactionReceipt({ hash: borrowHash });
        setStatus('Borrow confirmed on ' + chainLabel(selectedMarket.chainId) + '.');
        setCollateralAmount('');
        setBorrowAmount('');
      }

      if (action === 'repay') {
        const repay = parseUnits(repayAmount, 6);
        setStatus('Checking loan asset allowance…');
        const allowance = await publicClient.readContract({
          address: marketParams.loanToken,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address as Address, selectedMarket.morphoAddress as Address]
        });

        if (allowance < repay) {
          setStatus('Approve ' + selectedMarket.loanAsset + '…');
          const approveHash = await walletClient.writeContract({
            account: address as Address,
            chain,
            address: marketParams.loanToken,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [selectedMarket.morphoAddress as Address, repay]
          });
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }

        setStatus('Repaying debt…');
        const hash = await walletClient.writeContract({
          account: address as Address,
          chain,
          address: selectedMarket.morphoAddress as Address,
          abi: MORPHO_ABI,
          functionName: 'repay',
          args: [marketParams, repay, BigInt(0), address as Address, '0x']
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setStatus('Repayment confirmed.');
        setRepayAmount('');
      }

      if (action === 'withdraw') {
        const amount = parseUnits(withdrawAmount, selectedMarket.collateralDecimals);
        setStatus('Withdrawing collateral…');
        const hash = await walletClient.writeContract({
          account: address as Address,
          chain,
          address: selectedMarket.morphoAddress as Address,
          abi: MORPHO_ABI,
          functionName: 'withdrawCollateral',
          args: [marketParams, amount, address as Address, address as Address]
        });
        await publicClient.waitForTransactionReceipt({ hash });
        setStatus('Collateral withdrawal confirmed.');
        setWithdrawAmount('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed.');
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="borrow-v2-page">
        <header className="borrow-v2-head">
          <div>
            <span className="ro-kicker">CAPITAL / BORROW</span>
            <h1>Liquidity against your assets.</h1>
            <p>Select a live Morpho market, see its terms, supply collateral and borrow directly from your embedded wallet.</p>
          </div>
          <div className="borrow-v2-live"><i /> PROVIDER DATA</div>
        </header>

        {loading ? (
          <div className="borrow-v2-loading">Loading lending markets…</div>
        ) : (
          <>
            <section className="borrow-v2-network-row">
              {networks.map((item) => (
                <button key={item.key} type="button" className={networkKey === item.key ? 'active' : ''} onClick={() => setNetworkKey(item.key as 'base' | 'robinhood' | 'solana')}>
                  <span>{item.name}</span><small>{item.provider}</small>
                </button>
              ))}
            </section>

            {networkKey === 'solana' ? (
              <section className="borrow-v2-surface borrow-v2-solana">
                <span className="ro-kicker">SOLANA / KAMINO</span>
                <h2>Borrow on Kamino.</h2>
                <p>ROBANK currently uses a provider handoff for Solana lending. Open Kamino with the current provider rail.</p>
                <a href="https://app.kamino.finance/" target="_blank" rel="noreferrer">Open Kamino →</a>
              </section>
            ) : (
              <>
                <section className="borrow-v2-markets">
                  <div className="borrow-v2-section-title"><div><span className="ro-kicker">{network?.name} / MORPHO</span><h2>Markets</h2></div><small>{markets.length} live markets</small></div>
                  <div className="borrow-v2-market-grid">
                    {markets.map((market) => (
                      <button key={market.marketId} type="button" className={selectedMarket?.marketId === market.marketId ? 'selected' : ''} onClick={() => setSelectedMarketId(market.marketId)}>
                        <div className="borrow-v2-market-title"><b>{market.loanAsset}</b><span>vs {market.collateralAsset}</span></div>
                        <div className="borrow-v2-market-stats"><div><small>LLTV</small><strong>{market.lltv.toFixed(1)}%</strong></div><div><small>BORROW APY</small><strong>{market.borrowApy == null ? '—' : market.borrowApy.toFixed(2) + '%'}</strong></div><div><small>LIQUIDITY</small><strong>{money(market.liquidity)}</strong></div></div>
                      </button>
                    ))}
                    {!markets.length && <div className="borrow-v2-empty">No executable Morpho markets were returned for this network.</div>}
                  </div>
                </section>

                {selectedMarket && (
                  <section className="borrow-v2-workspace">
                    <div className="borrow-v2-market-overview">
                      <div><span className="ro-kicker">SELECTED MARKET</span><h2>{selectedMarket.loanAsset} / {selectedMarket.collateralAsset}</h2><p>{selectedMarket.collateralName} · {selectedMarket.network}</p></div>
                      <div className="borrow-v2-terms"><div><small>LLTV</small><b>{selectedMarket.lltv.toFixed(1)}%</b></div><div><small>BORROW APY</small><b>{selectedMarket.borrowApy == null ? '—' : selectedMarket.borrowApy.toFixed(2) + '%'}</b></div><div><small>AVAILABLE</small><b>{money(selectedMarket.liquidity)}</b></div></div>
                    </div>

                    <div className="borrow-v2-position-strip">
                      <div><small>YOUR COLLATERAL</small><b>{position.collateral.toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedMarket.collateralAsset}</b></div>
                      <div><small>YOUR DEBT</small><b>{position.borrow.toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedMarket.loanAsset}</b></div>
                      <div><small>WALLET BALANCE</small><b>{collateralBalance == null ? '—' : collateralBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })} {selectedMarket.collateralAsset}</b></div>
                    </div>

                    <div className="borrow-v2-action-grid">
                      <div className="borrow-v2-action-card">
                        <span className="ro-kicker">OPEN POSITION</span>
                        <h3>Supply collateral + borrow.</h3>
                        <label><span>COLLATERAL</span><div><input value={collateralAmount} onChange={(e) => setCollateralAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" inputMode="decimal" /><em>{selectedMarket.collateralAsset}</em></div></label>
                        <label><span>BORROW</span><div><input value={borrowAmount} onChange={(e) => setBorrowAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" inputMode="decimal" /><em>{selectedMarket.loanAsset}</em></div></label>
                        <button type="button" className="borrow-v2-primary" disabled={busy} onClick={() => void execute('borrow')}>{busy ? 'Processing…' : 'Supply & borrow'}</button>
                      </div>

                      <div className="borrow-v2-action-card">
                        <span className="ro-kicker">MANAGE POSITION</span>
                        <h3>Repay or withdraw.</h3>
                        <label><span>REPAY DEBT</span><div><input value={repayAmount} onChange={(e) => setRepayAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" inputMode="decimal" /><em>{selectedMarket.loanAsset}</em></div></label>
                        <button type="button" className="borrow-v2-secondary" disabled={busy || position.borrow <= 0} onClick={() => void execute('repay')}>Repay debt</button>
                        <label><span>WITHDRAW COLLATERAL</span><div><input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" inputMode="decimal" /><em>{selectedMarket.collateralAsset}</em></div></label>
                        <button type="button" className="borrow-v2-secondary" disabled={busy || position.collateral <= 0} onClick={() => void execute('withdraw')}>Withdraw collateral</button>
                      </div>
                    </div>

                    <div className="borrow-v2-risk-note"><b>Protocol guard</b><span>Borrowing is constrained by Morpho's oracle, LLTV, market liquidity and transaction simulation. ROBANK does not bypass those protocol checks.</span></div>
                    {(error || status) && <div className={error ? 'borrow-v2-message error' : 'borrow-v2-message'}>{error || status}</div>}
                  </section>
                )}
              </>
            )}
          </>
        )}

        <footer className="borrow-v2-foot"><Link href="/dashboard">← Back to Overview</Link><span>Rates, liquidity, LLTV and eligibility are read from Morpho/Kamino provider data.</span></footer>
      </div>
    </AppShell>
  );
}
