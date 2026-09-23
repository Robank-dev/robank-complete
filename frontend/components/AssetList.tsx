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

type Token = { id: string; chainId: number; chain: string; symbol: string; name: string; address?: `0x${string}`; image: string };

const DEFAULT_TOKENS: Token[] = [
  { id: 'base-eth', chainId: BASE_MAINNET_CHAIN_ID, chain: 'Base', symbol: 'ETH', name: 'Ethereum', image: '/token-icons/eth.svg' },
  { id: 'base-usdc', chainId: BASE_MAINNET_CHAIN_ID, chain: 'Base', symbol: 'USDC', name: 'USD Coin', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', image: '/token-icons/usdc.svg' },
  { id: 'rh-eth', chainId: ROBINHOOD_CHAIN_ID, chain: 'Robinhood Chain', symbol: 'ETH', name: 'Ethereum', image: '/token-icons/eth.svg' },
  { id: 'rh-usdg', chainId: ROBINHOOD_CHAIN_ID, chain: 'Robinhood Chain', symbol: 'USDG', name: 'Global Dollar', address: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168', image: '/token-icons/usdg.svg' }
];

function TokenRow({ token, owner }: { token: Token; owner: `0x${string}` }) {
  const native = !token.address;
  const nativeBalance = useBalance({ address: owner, chainId: token.chainId, query: { enabled: native } });
  const tokenBalance = useReadContract({
    address: token.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [owner],
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
  const amount = raw === undefined ? '—' : Number(formatUnits(raw, tokenDecimals)).toLocaleString(undefined, { maximumFractionDigits: 6 });

  return (
    <div className="asset-row">
      <div className="asset-symbol overflow-hidden bg-white/5 p-0.5">
        <img src={token.image} alt="" className="h-full w-full rounded-full object-cover" />
      </div>
      <div className="asset-name">
        <b>{token.symbol}</b>
        <span>{token.name} · {token.chain}</span>
      </div>
      <div className="asset-value">
        <b>{amount} {token.symbol}</b>
        <span>{token.address ? 'ERC-20' : 'Native asset'}</span>
      </div>
    </div>
  );
}

export default function AssetList() {
  const { address } = useAccount();
  const [custom, setCustom] = useState<Token[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ chainId: String(BASE_MAINNET_CHAIN_ID), address: '', symbol: '', name: '' });

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
    if (!address || !isAddress(form.address) || !form.symbol.trim() || !form.name.trim()) return;
    const chainId = Number(form.chainId);
    if (![BASE_MAINNET_CHAIN_ID, ROBINHOOD_CHAIN_ID].includes(chainId)) return;
    const token: Token = {
      id: `${chainId}-${form.address.toLowerCase()}`,
      chainId,
      chain: chainId === BASE_MAINNET_CHAIN_ID ? 'Base' : 'Robinhood Chain',
      symbol: form.symbol.trim().toUpperCase(),
      name: form.name.trim(),
      address: form.address as `0x${string}`,
      image: '/robank-mark.png'
    };
    const next = [...custom.filter((item) => item.id !== token.id), token];
    setCustom(next);
    localStorage.setItem(`robank.tokens.${address.toLowerCase()}`, JSON.stringify(next));
    setForm({ chainId: String(BASE_MAINNET_CHAIN_ID), address: '', symbol: '', name: '' });
    setOpen(false);
  };

  if (!address) return null;

  return (
    <div>
      <div className="asset-list">
        {visibleTokens.map((token) => <TokenRow key={token.id} token={token} owner={address} />)}
      </div>
      <button type="button" onClick={() => setOpen((value) => !value)} className="mt-4 text-xs text-white/55 hover:text-white">
        {open ? 'Cancel' : '+ Add token'}
      </button>
      {open && (
        <div className="mt-4 grid gap-2 rounded-2xl border border-ro-line bg-black/20 p-4 sm:grid-cols-2">
          <select value={form.chainId} onChange={(e) => setForm({ ...form, chainId: e.target.value })} className="rounded-xl border border-ro-line bg-black px-3 py-2 text-xs text-white">
            <option value={BASE_MAINNET_CHAIN_ID}>Base</option>
            <option value={ROBINHOOD_CHAIN_ID}>Robinhood Chain</option>
          </select>
          <input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="Ticker (e.g. WETH)" className="rounded-xl border border-ro-line bg-black px-3 py-2 text-xs text-white placeholder:text-white/25" />
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Token name" className="rounded-xl border border-ro-line bg-black px-3 py-2 text-xs text-white placeholder:text-white/25" />
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="0x token contract" className="rounded-xl border border-ro-line bg-black px-3 py-2 text-xs text-white placeholder:text-white/25 sm:col-span-2" />
          <button type="button" onClick={addToken} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black sm:col-span-2">Add token</button>
        </div>
      )}
    </div>
  );
}
