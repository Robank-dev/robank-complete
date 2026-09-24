'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount, useBalance, useReadContract, usePublicClient } from 'wagmi';
import { isAddress, formatUnits } from 'viem';
import { BASE_MAINNET_CHAIN_ID, ROBINHOOD_CHAIN_ID } from '@/lib/constants';

const ERC20_ABI = [
  { type: 'function', name: 'balanceOf', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'name', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] }
] as const;

type Token = { id: string; chainId: number; chain: string; symbol: string; name: string; address?: `0x${string}`; image: string; chainImage?: string };

const DEFAULT_TOKENS: Token[] = [
  { id: 'base-eth', chainId: BASE_MAINNET_CHAIN_ID, chain: 'Base', symbol: 'ETH', name: 'Ethereum', image: '/token-icons/eth.svg', chainImage: '/chain-icons/base.svg' },
  { id: 'base-usdc', chainId: BASE_MAINNET_CHAIN_ID, chain: 'Base', symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', image: '/token-icons/usdc.svg', chainImage: '/chain-icons/base.svg' },
  { id: 'rh-eth', chainId: ROBINHOOD_CHAIN_ID, chain: 'Robinhood Chain', symbol: 'ETH', name: 'Ethereum', image: '/token-icons/eth.svg', chainImage: '/chain-icons/robinhood.svg' },
  { id: 'rh-usdg', chainId: ROBINHOOD_CHAIN_ID, chain: 'Robinhood Chain', symbol: 'USDG', name: 'Global Dollar', address: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168', image: '/token-icons/usdg.png', chainImage: '/chain-icons/robinhood.svg' }
];

function TokenRow({ token, owner, ethPrice }: { token: Token; owner: `0x${string}`; ethPrice: number | null }) {
  const native = !token.address;
  const chainImage = token.chainImage || (token.chainId === BASE_MAINNET_CHAIN_ID ? '/chain-icons/base.svg' : '/chain-icons/robinhood.svg');
  const nativeBalance = useBalance({ address: owner, chainId: token.chainId, query: { enabled: native } });
  const tokenBalance = useReadContract({
    address: token.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [owner],
    chainId: token.chainId,
    query: { enabled: Boolean(token.address) }
  });
  const symbolRead = useReadContract({
    address: token.address,
    abi: ERC20_ABI,
    functionName: 'symbol',
    chainId: token.chainId,
    query: { enabled: Boolean(token.address) }
  });
  const nameRead = useReadContract({
    address: token.address,
    abi: ERC20_ABI,
    functionName: 'name',
    chainId: token.chainId,
    query: { enabled: Boolean(token.address) }
  });
  const decimals = useReadContract({
    address: token.address,
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId: token.chainId,
    query: { enabled: Boolean(token.address) }
  });
  const raw = native ? nativeBalance.data?.value : tokenBalance.data as bigint | undefined;
  const loading = native ? nativeBalance.isLoading : tokenBalance.isLoading;
  const tokenDecimals = native ? 18 : Number(decimals.data ?? 6);
  if (raw == null) {
    if (!loading) return null;
    return <div className="asset-row"><div className="asset-symbol-wrap"><div className="asset-symbol bg-white/5" /><div className="asset-chain-icon asset-chain-badge bg-white/5" /></div><div className="asset-name"><b>Loading asset</b><span>Checking balance…</span></div><div className="asset-quantity"><b>—</b><span>Quantity</span></div><div className="asset-value"><b>—</b><span>Value</span></div></div>;
  }
  if (raw === BigInt(0)) return null;
  const displaySymbol = native ? token.symbol : String(symbolRead.data ?? (token.symbol || 'TOKEN'));
  const displayName = native ? token.name : String(nameRead.data ?? (token.name || 'Token'));
  const numericAmount = raw === undefined ? null : Number(formatUnits(raw, tokenDecimals));
  const quantity = numericAmount == null ? '—' : numericAmount.toLocaleString(undefined, { maximumFractionDigits: 6 });
  const valueUsd = numericAmount == null ? null : native ? (ethPrice ? numericAmount * ethPrice : null) : ['USDC', 'USDG'].includes(displaySymbol.toUpperCase()) ? numericAmount : null;
  const value = valueUsd == null ? '—' : `$${valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="asset-row">
      <div className="asset-symbol-wrap">
        <div className="asset-symbol overflow-hidden bg-white/5 p-1.5"><img src={token.image} alt="" className="h-full w-full rounded-full object-contain" /></div>
        <img src={chainImage} alt="" className="asset-chain-icon asset-chain-badge" />
      </div>
      <div className="asset-name"><b>{displayName}</b><span>{displaySymbol}</span></div>
      <div className="asset-quantity"><b>{quantity}</b><span>Quantity</span></div>
      <div className="asset-value"><b>{value}</b><span>Value</span></div>
    </div>
  );
}

export default function AssetList() {
  const { address } = useAccount();
  const [custom, setCustom] = useState<Token[]>([]);
  const [open, setOpen] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [form, setForm] = useState({ chainId: String(BASE_MAINNET_CHAIN_ID), address: '' });
  const publicClient = usePublicClient({ chainId: Number(form.chainId) });

  useEffect(() => {
    if (!address) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`robank.tokens.${address.toLowerCase()}`) ?? '[]');
      setCustom(Array.isArray(saved) ? saved : []);
    } catch {
      setCustom([]);
    }
  }, [address]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot', { cache: 'no-store' });
        const payload = await response.json();
        const price = Number(payload?.data?.amount);
        if (!cancelled && Number.isFinite(price) && price > 0) setEthPrice(price);
      } catch {
        if (!cancelled) setEthPrice(null);
      }
    };
    load();
    const timer = window.setInterval(load, 30_000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  const tokens = useMemo(() => [...DEFAULT_TOKENS, ...custom], [custom]);
  const visibleTokens = tokens.filter((token) => token.chainId === BASE_MAINNET_CHAIN_ID || token.chainId === ROBINHOOD_CHAIN_ID);

  const addToken = async () => {
    setTokenError('');
    if (!address || !isAddress(form.address)) {
      setTokenError('Enter a valid contract address.');
      return;
    }
    if (!publicClient) {
      setTokenError('Network client is unavailable.');
      return;
    }
    const chainId = Number(form.chainId);
    if (![BASE_MAINNET_CHAIN_ID, ROBINHOOD_CHAIN_ID].includes(chainId)) return;
    try {
      const contractAddress = form.address as `0x${string}`;
      const [symbol, name, decimals] = await Promise.all([
        publicClient.readContract({ address: contractAddress, abi: ERC20_ABI, functionName: 'symbol' }),
        publicClient.readContract({ address: contractAddress, abi: ERC20_ABI, functionName: 'name' }),
        publicClient.readContract({ address: contractAddress, abi: ERC20_ABI, functionName: 'decimals' })
      ]);
      if (!symbol || !name || Number(decimals) < 0 || Number(decimals) > 255) throw new Error('Invalid token metadata');
      const token: Token = {
        id: `${chainId}-${form.address.toLowerCase()}`,
        chainId,
        chain: chainId === BASE_MAINNET_CHAIN_ID ? 'Base' : 'Robinhood Chain',
        symbol: String(symbol),
        name: String(name),
        address: contractAddress,
        image: '/token-icons/asset.svg',
        chainImage: chainId === BASE_MAINNET_CHAIN_ID ? '/chain-icons/base.svg' : '/chain-icons/robinhood.svg'
      };
      const next = [...custom.filter((item) => item.id !== token.id), token];
      setCustom(next);
      localStorage.setItem(`robank.tokens.${address.toLowerCase()}`, JSON.stringify(next));
      setForm({ chainId: String(BASE_MAINNET_CHAIN_ID), address: '' });
      setOpen(false);
    } catch {
      setTokenError('Contract metadata could not be read on the selected network. Check the chain and address.');
      setOpen(true);
    }
  };

  if (!address) return null;

  return (
    <div>
      <div className="asset-list">
        {visibleTokens.map((token) => <TokenRow key={token.id} token={token} owner={address} ethPrice={ethPrice} />)}
      </div>
      <button type="button" onClick={() => setOpen((value) => !value)} className="asset-add-trigger">
        {open ? 'Cancel' : '+ Add token'}
      </button>
      {open && (
        <div className="asset-add-form">
          <div className="asset-add-field">
            <label>NETWORK</label>
            <select value={form.chainId} onChange={(e) => setForm({ ...form, chainId: e.target.value })}>
              <option value={BASE_MAINNET_CHAIN_ID}>Base</option>
              <option value={ROBINHOOD_CHAIN_ID}>Robinhood Chain</option>
            </select>
          </div>
          <div className="asset-add-field">
            <label>CONTRACT ADDRESS</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="0x…" />
          </div>
          <button type="button" onClick={addToken} className="asset-add-submit">Add token</button>
          {tokenError && <p className="asset-add-hint text-white/60">{tokenError}</p>}
          <p className="asset-add-hint">Token name, ticker and balance are read from the contract automatically.</p>
        </div>
      )}
    </div>
  );
}
