'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAccount, useBalance, useReadContract } from 'wagmi';
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

function TokenRow({ token, owner }: { token: Token; owner: `0x${string}` }) {
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
  const tokenDecimals = native ? 18 : Number(decimals.data ?? 6);
  const displaySymbol = native ? token.symbol : String(symbolRead.data ?? (token.symbol || 'TOKEN'));
  const displayName = native ? token.name : String(nameRead.data ?? (token.name || 'Token'));
  const amount = raw === undefined ? '—' : Number(formatUnits(raw, tokenDecimals)).toLocaleString(undefined, { maximumFractionDigits: 6 });

  return (
    <div className="asset-row">
      <div className="asset-symbol overflow-hidden bg-white/5 p-0.5">
        <img src={token.image} alt="" className="h-full w-full rounded-full object-cover" />
      </div>
      <div className="asset-name">
        <b>{displaySymbol}</b>
        <span><img src={chainImage} alt="" className="asset-chain-icon" />{displayName} · {token.chain}</span>
      </div>
      <div className="asset-value">
        <b>{amount} {displaySymbol}</b>
        <span>{token.address ? 'ERC-20' : 'Native asset'}</span>
      </div>
    </div>
  );
}

export default function AssetList() {
  const { address } = useAccount();
  const [custom, setCustom] = useState<Token[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ chainId: String(BASE_MAINNET_CHAIN_ID), address: '' });

  useEffect(() => {
    if (!address) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`robank.tokens.${address.toLowerCase()}`) ?? '[]');
      setCustom(Array.isArray(saved) ? saved : []);
    } catch {
      setCustom([]);
    }
  }, [address]);

  const tokens = useMemo(() => [...DEFAULT_TOKENS, ...custom], [custom]);
  const visibleTokens = tokens.filter((token) => token.chainId === BASE_MAINNET_CHAIN_ID || token.chainId === ROBINHOOD_CHAIN_ID);

  const addToken = () => {
    if (!address || !isAddress(form.address)) return;
    const chainId = Number(form.chainId);
    if (![BASE_MAINNET_CHAIN_ID, ROBINHOOD_CHAIN_ID].includes(chainId)) return;
    const token: Token = {
      id: `${chainId}-${form.address.toLowerCase()}`,
      chainId,
      chain: chainId === BASE_MAINNET_CHAIN_ID ? 'Base' : 'Robinhood Chain',
      symbol: '',
      name: '',
      address: form.address as `0x${string}`,
      image: chainId === BASE_MAINNET_CHAIN_ID ? '/chain-icons/base.svg' : '/chain-icons/robinhood.svg',
      chainImage: chainId === BASE_MAINNET_CHAIN_ID ? '/chain-icons/base.svg' : '/chain-icons/robinhood.svg'
    };
    const next = [...custom.filter((item) => item.id !== token.id), token];
    setCustom(next);
    localStorage.setItem(`robank.tokens.${address.toLowerCase()}`, JSON.stringify(next));
    setForm({ chainId: String(BASE_MAINNET_CHAIN_ID), address: '' });
    setOpen(false);
  };

  if (!address) return null;

  return (
    <div>
      <div className="asset-list">
        {visibleTokens.map((token) => <TokenRow key={token.id} token={token} owner={address} />)}
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
          <p className="asset-add-hint">Token name, ticker and balance are read from the contract automatically.</p>
        </div>
      )}
    </div>
  );
}
