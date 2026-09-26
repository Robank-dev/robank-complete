'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPublicClient, createWalletClient, custom, encodeFunctionData, http, isAddress, parseUnits } from 'viem';
import { useAccount, useChainId } from 'wagmi';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import { convertQuoteToRoute, executeRoute } from '@lifi/sdk';
import { api } from '@/lib/api';
import { createRobankLifiClient } from '@/lib/lifi';
import { roBankEvmChains } from '@/lib/wagmi';
import { Picker, type PickerOption } from './Picker';

const NETWORKS = [
  { id: 1, label: 'Ethereum', type: 'evm', image: '/token-icons/ethereum.png' },
  { id: 8453, label: 'Base', type: 'evm', image: '/chain-icons/base.svg' },
  { id: 42161, label: 'Arbitrum', type: 'evm', image: '/chain-icons/arbitrum.svg' },
  { id: 10, label: 'Optimism', type: 'evm', image: '/chain-icons/optimism.svg' },
  { id: 137, label: 'Polygon', type: 'evm', image: '/chain-icons/polygon.svg' },
  { id: 56, label: 'BNB Chain', type: 'evm', image: '/chain-icons/bnb.svg' },
  { id: 4663, label: 'Robinhood Chain', type: 'evm', image: '/chain-icons/robinhood.svg' },
  { id: 1151111081099710, label: 'Solana', type: 'solana', image: '/chain-icons/solana.svg' },
] as const;

const STABLES = [
  { symbol: 'USDC', name: 'USDC', image: '/token-icons/usdc.svg' },
  { symbol: 'USDT', name: 'USDT', image: '/token-icons/usdt.svg' },
  { symbol: 'USDG', name: 'USDG', image: '/token-icons/usdg.png' },
] as const;

type FeeMode = 'amount' | 'wallet';
type TokenInfo = { chainId: number; address: string; symbol: string; decimals: number };
type QuoteState = { quote: any; loading: boolean; error: string };
type Holding = { symbol: string; name: string; logo: string; quantity: number; valueUsd: number; assetType?: 'stablecoin' | 'xstock'; network?: string; chainId?: number; contractAddress?: string; decimals?: number };
type XStock = { id: string; symbol: string; name: string; logo: string; underlyingSymbol: string; deployments: Array<{ chainId: number; network: string; address: string; decimals: number }> };

function isSolanaAddress(value: string) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value.trim());
}

function validRecipient(networkId: number, value: string) {
  if (!value.trim()) return false;
  if (networkId === 1151111081099710) return isSolanaAddress(value);
  return isAddress(value);
}

function formatTokenAmount(value: string, decimals: number, max = 6) {
  try {
    return Number(BigInt(value || '0') / (BigInt(10) ** BigInt(decimals))).toLocaleString(undefined, { maximumFractionDigits: max });
  } catch {
    return '—';
  }
}

function money(value: number) {
  return Number.isFinite(value) ? '$' + value.toFixed(2) : '—';
}

function quoteFees(quote: any) {
  const costs = Array.isArray(quote?.estimate?.feeCosts) ? quote.estimate.feeCosts : [];
  let total = 0;
  for (const cost of costs) total += Number(cost?.amountUSD || 0);
  const gas = (quote?.estimate?.gasCosts || []).reduce((sum: number, cost: any) => sum + Number(cost?.amountUSD || 0), 0);
  return { total, gas };
}

function networkOption(id: number, balance = 0): PickerOption {
  const network = NETWORKS.find((item) => item.id === id) || NETWORKS[0];
  return {
    id: String(network.id),
    label: network.label,
    image: network.image,
    meta: balance > 0 ? '$' + balance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : undefined,
    value: balance
  };
}

export default function SendForm() {
  const { authenticated } = usePrivy();
  const { address: wagmiAddress } = useAccount();
  const currentEvmChainId = useChainId();
  const { wallets } = useWallets();
  const { wallets: solanaWallets } = useSolanaWallets();
  const evmWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
  const evmAddress = evmWallet?.address || wagmiAddress || '';
  const solanaWallet = solanaWallets.find((wallet: any) => wallet.isPrivyWallet) ?? solanaWallets[0];

  const [destinationType, setDestinationType] = useState<'wallet' | 'bank'>('wallet');
  const [asset, setAsset] = useState('USDC');
  const [fromChain, setFromChain] = useState(8453);
  const [toChain, setToChain] = useState(8453);
  const [to, setTo] = useState('');
  const [bankName, setBankName] = useState('');
  const [amount, setAmount] = useState('');
  const [feeMode, setFeeMode] = useState<FeeMode>('wallet');
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [xstocks, setXstocks] = useState<XStock[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [quoteState, setQuoteState] = useState<QuoteState>({ quote: null, loading: false, error: '' });
  const [status, setStatus] = useState('');

  const lifiClient = useMemo(() => createRobankLifiClient({
    evmWallet,
    solanaWallet,
    currentEvmChainId: currentEvmChainId || 8453,
  }), [evmWallet, solanaWallet, currentEvmChainId]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      api.lifiTokens(),
      api.xstocks(),
      api.portfolio(evmAddress, solanaWallet?.address || '')
    ]).then((results) => {
      if (cancelled) return;
      const lifi = results[0];
      const x = results[1];
      const p = results[2];
      if (lifi.status === 'fulfilled') setTokens(lifi.value.tokens as TokenInfo[]);
      if (x.status === 'fulfilled') setXstocks(x.value.assets as XStock[]);
      if (p.status === 'fulfilled') setHoldings(p.value.assets as Holding[]);
    });
    return () => { cancelled = true; };
  }, [evmAddress, solanaWallet?.address]);

  const holdingValue = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of holdings) map.set(item.symbol, (map.get(item.symbol) || 0) + Number(item.valueUsd || 0));
    return map;
  }, [holdings]);

  const assetOptions = useMemo<PickerOption[]>(() => {
    const seen = new Set<string>();
    const list: PickerOption[] = [];

    for (const stable of STABLES) {
      seen.add(stable.symbol);
      list.push({
        id: stable.symbol,
        label: stable.symbol,
        image: stable.image,
        value: holdingValue.get(stable.symbol) || 0
      });
    }

    for (const item of xstocks) {
      if (seen.has(item.symbol)) continue;
      seen.add(item.symbol);
      list.push({
        id: 'x:' + item.symbol,
        label: item.symbol,
        name: item.name,
        image: item.logo,
        meta: item.underlyingSymbol + ' xStock',
        value: holdingValue.get(item.symbol) || 0
      });
    }

    return list.sort((a, b) => {
      const av = Number(a.value || 0);
      const bv = Number(b.value || 0);
      if (bv !== av) return bv - av;
      return a.label.localeCompare(b.label);
    });
  }, [holdingValue, xstocks]);

  const selectedAssetOption = assetOptions.find((item) => item.id === asset) || assetOptions.find((item) => item.label === asset) || assetOptions[0];

  const isXstock = asset.startsWith('x:');
  const selectedSymbol = isXstock ? asset.slice(2) : asset;

  const sourceOptions = useMemo<PickerOption[]>(() => {
    if (isXstock) {
      const item = xstocks.find((stock) => stock.symbol === selectedSymbol);
      return (item?.deployments || [])
        .filter((deployment) => NETWORKS.some((network) => network.id === deployment.chainId))
        .map((deployment) => networkOption(deployment.chainId, holdings.find((holding) =>
          holding.assetType === 'xstock' &&
          holding.symbol === selectedSymbol &&
          holding.chainId === deployment.chainId
        )?.valueUsd || 0));
    }

    const seen = new Set<number>();
    const out: PickerOption[] = [];
    for (const token of tokens) {
      if (token.symbol !== selectedSymbol) continue;
      const id = Number(token.chainId);
      if (seen.has(id) || !NETWORKS.some((network) => network.id === id)) continue;
      seen.add(id);
      out.push(networkOption(id, 0));
    }
    return out;
  }, [holdings, isXstock, selectedSymbol, tokens, xstocks]);

  useEffect(() => {
    if (!selectedAssetOption) return;
    const newSymbol = selectedAssetOption.id;
    if (newSymbol !== asset) setAsset(newSymbol);
  }, [selectedAssetOption, asset]);

  useEffect(() => {
    if (!sourceOptions.some((item) => item.id === String(fromChain)) && sourceOptions[0]) {
      setFromChain(Number(sourceOptions[0].id));
    }
  }, [fromChain, sourceOptions]);

  useEffect(() => {
    const trimmed = to.trim();
    if (validRecipient(1151111081099710, trimmed)) {
      setToChain(1151111081099710);
    } else {
      setToChain(fromChain === 1151111081099710 ? 8453 : fromChain);
    }
  }, [to, fromChain]);

  const selectedXstock = isXstock ? xstocks.find((stock) => stock.symbol === selectedSymbol) : undefined;
  const sourceToken = isXstock
    ? selectedXstock?.deployments.find((deployment) => deployment.chainId === fromChain)
      ? {
          chainId: fromChain,
          address: selectedXstock.deployments.find((deployment) => deployment.chainId === fromChain)!.address,
          symbol: selectedSymbol,
          decimals: selectedXstock.deployments.find((deployment) => deployment.chainId === fromChain)!.decimals || 18
        }
      : undefined
    : tokens.find((token) => token.symbol === selectedSymbol && Number(token.chainId) === fromChain);

  const destinationToken = isXstock
    ? selectedXstock?.deployments.find((deployment) => deployment.chainId === toChain)
      ? {
          chainId: toChain,
          address: selectedXstock.deployments.find((deployment) => deployment.chainId === toChain)!.address,
          symbol: selectedSymbol,
          decimals: selectedXstock.deployments.find((deployment) => deployment.chainId === toChain)!.decimals || 18
        }
      : undefined
    : tokens.find((token) => token.symbol === selectedSymbol && Number(token.chainId) === toChain);

  const sourceAddress = fromChain === 1151111081099710 ? solanaWallet?.address : evmAddress;
  const directEvmTransfer = Boolean(destinationType === 'wallet' && fromChain === toChain && fromChain !== 1151111081099710 && sourceToken && sourceAddress && validRecipient(toChain, to) && Number(amount) > 0);
  const directSolanaTransfer = Boolean(destinationType === 'wallet' && fromChain === toChain && fromChain === 1151111081099710 && sourceToken && sourceAddress && validRecipient(toChain, to) && Number(amount) > 0);
  const canQuote = Boolean(
    authenticated &&
    destinationType === 'wallet' &&
    !directEvmTransfer &&
    !directSolanaTransfer &&
    sourceToken &&
    destinationToken &&
    sourceAddress &&
    validRecipient(toChain, to) &&
    Number(amount) > 0
  );

  useEffect(() => {
    let active = true;
    if (!canQuote || !sourceToken || !destinationToken || !sourceAddress) {
      setQuoteState((previous) => ({ ...previous, quote: null, loading: false }));
      return () => { active = false; };
    }
    setQuoteState({ quote: null, loading: true, error: '' });
    const timer = window.setTimeout(async () => {
      try {
        const response = await api.lifiQuote({
          fromChain,
          toChain,
          fromToken: sourceToken.address,
          toToken: destinationToken.address,
          fromAddress: sourceAddress,
          toAddress: to.trim(),
          amount: parseUnits(amount, sourceToken.decimals).toString(),
          mode: feeMode === 'wallet' ? 'toAmount' : 'fromAmount',
        });
        if (active) setQuoteState({ quote: response.quote, loading: false, error: '' });
      } catch (error) {
        if (active) setQuoteState({ quote: null, loading: false, error: error instanceof Error ? error.message : 'No route available.' });
      }
    }, 450);
    return () => { active = false; window.clearTimeout(timer); };
  }, [canQuote, destinationToken, feeMode, fromChain, sourceAddress, sourceToken, to, toChain, amount]);

  const quote = quoteState.quote;
  const fees = quote ? quoteFees(quote) : null;
  const destinationDecimals = destinationToken?.decimals ?? sourceToken?.decimals ?? 6;
  const quotedReceive = quote?.estimate?.toAmount ? formatTokenAmount(quote.estimate.toAmount, destinationDecimals) : '—';
  const receiveAmount = directEvmTransfer ? amount || '—' : feeMode === 'wallet' ? (quote ? amount || '—' : '—') : quotedReceive;

  async function submit() {
    if (destinationType === 'bank') return setStatus('Bank payout rail is not connected yet.');
    if (!authenticated) return setStatus('Sign in with email first.');
    if (directSolanaTransfer) return setStatus('Direct Solana transfer is not connected yet.');
    if (directEvmTransfer) {
      if (!evmWallet || !evmAddress || !sourceToken) return setStatus('Wallet or asset unavailable.');
      try {
        setStatus('Opening secure wallet approval…');
        await evmWallet.switchChain(fromChain);
        const chain = roBankEvmChains.find((item) => item.id === fromChain) ?? roBankEvmChains[0];
        const provider = await evmWallet.getEthereumProvider();
        const walletClient = createWalletClient({ account: evmAddress as any, chain, transport: custom(provider) });
        const publicClient = createPublicClient({ chain, transport: http(chain.rpcUrls.default.http[0]) });
        const data = encodeFunctionData({
          abi: [{ type: 'function', name: 'transfer', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }],
          functionName: 'transfer',
          args: [to.trim() as `0x${string}`, parseUnits(amount, sourceToken.decimals)]
        });
        const hash = await walletClient.sendTransaction({ account: evmAddress as any, to: sourceToken.address as any, data, value: BigInt(0) });
        setStatus('Transfer submitted. Confirming on-chain…');
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        setStatus(receipt.status === 'success' ? 'Transfer confirmed.' : 'Transfer reverted.');
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Transfer failed.');
      }
      return;
    }

    if (!quote) return setStatus('Enter a valid recipient and amount.');
    if (!sourceToken || !destinationToken || !sourceAddress) return setStatus('Source asset or wallet unavailable.');
    try {
      setStatus('Opening secure transaction approval…');
      const route = convertQuoteToRoute(quote);
      await executeRoute(lifiClient, route, { executeInBackground: false });
      setStatus('Transfer completed.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Transaction failed.');
    }
  }

  const canSend = destinationType === 'wallet' &&
    Boolean(authenticated && sourceToken && sourceAddress && validRecipient(toChain, to) && Number(amount) > 0) &&
    (directEvmTransfer || Boolean(quote)) && !quoteState.loading && !directSolanaTransfer;

  const currentChain = sourceOptions.find((item) => item.id === String(fromChain));

  return (
    <div className="send-workspace send-premium-workspace">
      <div className="send-destination-tabs">
        <button type="button" onClick={() => setDestinationType('wallet')} className={destinationType === 'wallet' ? 'active' : ''}>
          <b>Wallet</b><span>Onchain address</span>
        </button>
        <button type="button" onClick={() => setDestinationType('bank')} className={destinationType === 'bank' ? 'active' : ''}>
          <b>Bank</b><span>Beneficiary account</span>
        </button>
      </div>

      <div className="send-form-card">
        {destinationType === 'wallet' ? (
          <>
            <div className="send-picker-grid">
              <Picker
                label="ASSET"
                value={selectedAssetOption}
                options={assetOptions}
                onChange={(option) => setAsset(option.id)}
                placeholder="Select asset"
                searchPlaceholder="Search asset or xStock..."
              />
              <Picker
                label="SELECT CHAIN"
                value={currentChain}
                options={sourceOptions}
                onChange={(option) => setFromChain(Number(option.id))}
                placeholder="Select chain"
                searchPlaceholder="Search chain..."
              />
            </div>

            <label className="send-field-large send-full">
              <span>RECIPIENT ADDRESS</span>
              <input value={to} onChange={(event) => setTo(event.target.value)} placeholder="Paste address" />
            </label>

            <label className="send-field-large send-full">
              <span>AMOUNT</span>
              <input value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))} placeholder="0.00" inputMode="decimal" />
            </label>

            <div className="send-fee-compact">
              <span className="send-fee-label">FEE</span>
              <div className="send-fee-toggle">
                <button type="button" className={feeMode === 'wallet' ? 'selected' : ''} onClick={() => setFeeMode('wallet')}>Add fee to amount</button>
                <button type="button" className={feeMode === 'amount' ? 'selected' : ''} onClick={() => setFeeMode('amount')}>Subtract fee from amount</button>
              </div>
              <div className="send-receive-line"><span>Receive amount</span><b>{receiveAmount}{receiveAmount !== '—' ? ' ' + selectedSymbol : ''}</b></div>
              {fees && fees.total > 0 && <div className="send-fee-estimate">Estimated network fee {money(fees.total)}</div>}
              {directEvmTransfer && <div className="send-fee-estimate">Network fee is estimated in your wallet approval.</div>}
              {quoteState.error && <div className="send-fee-error">{quoteState.error}</div>}
            </div>
          </>
        ) : (
          <div className="send-form-grid">
            <label>BANK / BENEFICIARY<input value={bankName} onChange={(event) => setBankName(event.target.value)} placeholder="Recipient or bank name" /></label>
            <label>ACCOUNT / ADDRESS<input value={to} onChange={(event) => setTo(event.target.value)} placeholder="Account or beneficiary address" /></label>
            <label className="send-full">AMOUNT<input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" inputMode="decimal" /></label>
          </div>
        )}

        <button onClick={submit} className="send-submit send-submit-bottom" disabled={!canSend}>
          {quoteState.loading ? 'Calculating…' : 'Send'}
        </button>
        {status && <p className="send-status">{status}</p>}
      </div>
    </div>
  );
}
