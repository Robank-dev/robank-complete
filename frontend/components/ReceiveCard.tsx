'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import { useWallets } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { useWallets as useSolanaWallets } from '@privy-io/react-auth/solana';
import { api } from '@/lib/api';
import CopyButton from './CopyButton';
import { Picker, type PickerOption } from './Picker';

const NETWORKS = [
  [1, 'Ethereum', '/token-icons/ethereum.png'],
  [8453, 'Base', '/chain-icons/base.svg'],
  [42161, 'Arbitrum', '/chain-icons/arbitrum.svg'],
  [10, 'Optimism', '/chain-icons/optimism.svg'],
  [137, 'Polygon', '/chain-icons/polygon.svg'],
  [56, 'BNB Chain', '/chain-icons/bnb.svg'],
  [4663, 'Robinhood Chain', '/chain-icons/robinhood.svg'],
  [1151111081099710, 'Solana', '/chain-icons/solana.svg']
] as const;

const STABLES = [
  { symbol: 'USDC', image: '/token-icons/usdc.svg' },
  { symbol: 'USDT', image: '/token-icons/usdt.svg' },
  { symbol: 'USDG', image: '/token-icons/usdg.png' }
] as const;

type Token = { chainId: number; address: string; symbol: string; decimals: number; name?: string; logoURI?: string };
type XStock = { id: string; symbol: string; name: string; logo: string; deployments: Array<{ chainId: number; network: string; address: string; decimals: number }> };

function networkLabel(id: number) {
  return NETWORKS.find(([chainId]) => chainId === id)?.[1] || 'Network';
}

function networkImage(id: number) {
  return NETWORKS.find(([chainId]) => chainId === id)?.[2] || null;
}

export default function ReceiveCard() {
  const { wallets } = useWallets();
  const { address: wagmiAddress } = useAccount();
  const { wallets: solanaWallets } = useSolanaWallets();
  const evmWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
  const solanaWallet = solanaWallets.find((wallet: any) => wallet.isPrivyWallet) ?? solanaWallets[0];
  const [tokens, setTokens] = useState<Token[]>([]);
  const [xstocks, setXstocks] = useState<XStock[]>([]);
  const [asset, setAsset] = useState('USDC');
  const [chainId, setChainId] = useState(8453);
  const [searchableAssets, setSearchableAssets] = useState<PickerOption[]>([]);
  const [qr, setQr] = useState('');
  const [error, setError] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([api.lifiTokens(), api.xstocks()]).then((results) => {
      if (cancelled) return;
      if (results[0].status === 'fulfilled') setTokens(results[0].value.tokens as Token[]);
      if (results[1].status === 'fulfilled') setXstocks(results[1].value.assets as XStock[]);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const assetOptions = useMemo<PickerOption[]>(() => {
    const out: PickerOption[] = STABLES.map((item) => ({
      id: item.symbol,
      label: item.symbol,
      image: item.image
    }));
    const seen = new Set<string>(STABLES.map((item) => item.symbol));
    for (const item of xstocks) {
      if (seen.has(item.symbol)) continue;
      seen.add(item.symbol);
      out.push({
        id: 'x:' + item.symbol,
        label: item.symbol,
        name: item.name,
        image: item.logo,
        meta: 'xStock'
      });
    }
    return out;
  }, [xstocks]);

  useEffect(() => {
    setSearchableAssets(assetOptions);
    const requestedAsset = searchParams.get('asset') || '';
    if (requestedAsset) {
      const match = assetOptions.find((option) => option.label.toLowerCase() === requestedAsset.toLowerCase());
      if (match) setAsset(match.id);
    }
  }, [assetOptions, searchParams]);

  const selectedSymbol = asset.startsWith('x:') ? asset.slice(2) : asset;
  const isXstock = asset.startsWith('x:');

  const availableChains = useMemo<PickerOption[]>(() => {
    if (isXstock) {
      const item = xstocks.find((stock) => stock.symbol === selectedSymbol);
      return (item?.deployments || [])
        .filter((deployment) => NETWORKS.some(([id]) => id === deployment.chainId))
        .map((deployment) => ({
          id: String(deployment.chainId),
          label: deployment.network,
          image: networkImage(deployment.chainId),
          meta: 'Deposit network'
        }));
    }
    const seen = new Set<number>();
    const out: PickerOption[] = [];
    for (const token of tokens) {
      if (token.symbol !== selectedSymbol) continue;
      const id = Number(token.chainId);
      if (seen.has(id) || !NETWORKS.some(([chainId]) => chainId === id)) continue;
      seen.add(id);
      out.push({ id: String(id), label: networkLabel(id), image: networkImage(id), meta: 'Deposit network' });
    }
    return out;
  }, [isXstock, selectedSymbol, tokens, xstocks]);

  const selectedAsset = searchableAssets.find((option) => option.id === asset) || searchableAssets.find((option) => option.label === selectedSymbol) || searchableAssets[0];
  const selectedChain = availableChains.find((option) => option.id === String(chainId)) || availableChains[0];
  const evmAddress = evmWallet?.address || wagmiAddress || '';
  const address = chainId === 1151111081099710 ? solanaWallet?.address || '' : evmAddress;

  useEffect(() => {
    if (!selectedAsset) return;
    if (selectedAsset.id !== asset) setAsset(selectedAsset.id);
  }, [asset, selectedAsset]);

  useEffect(() => {
    const requestedChain = searchParams.get('chain') || '';
    const requested = availableChains.find((option) => {
      const network = NETWORKS.find(([id]) => String(id) === option.id);
      return requestedChain && (option.label.toLowerCase() === requestedChain.toLowerCase() || network?.[0]?.toString() === requestedChain);
    });
    if (requested) {
      setChainId(Number(requested.id));
      return;
    }
    if (!selectedChain && availableChains[0]) setChainId(Number(availableChains[0].id));
    else if (selectedChain && selectedChain.id !== String(chainId)) setChainId(Number(selectedChain.id));
  }, [availableChains, chainId, selectedChain, searchParams]);

  useEffect(() => {
    setError('');
    if (!address) { setQr(''); return; }
    QRCode.toDataURL(address, {
      width: 420,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#060708', light: '#f6f7f8' }
    }).then(setQr).catch(() => setQr(''));
  }, [address, asset, chainId]);

  return (
    <div className="receive-premium-shell">
      <div className="receive-hero-copy">
        <div className="receive-orb" />
        <div className="ro-kicker">RECEIVE</div>
        <h1>Your deposit address.</h1>
        <p>Choose what you are receiving and the network. ROBANK will show the correct address for that rail.</p>
      </div>

      <section className="receive-selector-card receive-selector-modern">
        <div className="receive-selector-grid">
          <Picker
            label="ASSET"
            value={selectedAsset}
            options={searchableAssets}
            onChange={(option) => setAsset(option.id)}
            placeholder="Select asset"
            searchPlaceholder="Search asset or xStock..."
          />
          <Picker
            label="NETWORK"
            value={selectedChain}
            options={availableChains}
            onChange={(option) => setChainId(Number(option.id))}
            placeholder="Select network"
            searchPlaceholder="Search network..."
          />
        </div>
      </section>

      <section className="receive-address-card">
        <div className="receive-qr-panel">
          <div className="receive-qr-frame">
            {qr ? <img src={qr} alt={'Deposit QR for ' + selectedSymbol + ' on ' + networkLabel(chainId)} /> : <div className="receive-qr-empty">{address ? 'Generating QR…' : 'Wallet address is preparing…'}</div>}
          </div>
          <span>SCAN TO RECEIVE</span>
        </div>
        <div className="receive-address-panel">
          <div className="ro-kicker">YOUR {networkLabel(chainId).toUpperCase()} ADDRESS</div>
          <div className="receive-address-value">{address || 'Wallet preparing…'}</div>
          <div className="receive-address-meta">
            <div><span>ASSET</span><b>{selectedSymbol}</b></div>
            <div><span>NETWORK</span><b>{networkLabel(chainId)}</b></div>
          </div>
          <CopyButton value={address} label="Copy deposit address" disabled={!address} />
          {chainId === 1151111081099710
            ? <p className="receive-note">This is your dedicated Solana wallet address.</p>
            : <p className="receive-note">EVM networks use the same ROBANK EVM wallet address. Match both asset and network before sending.</p>}
          {error && <div className="receive-error">{error}</div>}
        </div>
      </section>

      <div className="receive-safe-strip">
        <span>◎</span>
        <div><b>Deposit carefully.</b><small>Only send the selected asset on the selected network to the address shown above.</small></div>
      </div>
    </div>
  );
}
