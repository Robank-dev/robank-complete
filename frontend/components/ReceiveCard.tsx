'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import { api } from '@/lib/api';
import { CHAINS, NATIVE_LOGOS, STABLECOINS, STABLE_META, chainById, chainByKey, explorerAddress, type StableSymbol } from '@/lib/chains';
import { useRobankAccount } from '@/lib/hooks/useRobankAccount';
import CopyButton from './CopyButton';
import { Alert, Picker, Skeleton, type PickerOption } from './ui';

type ReceiveAsset = { id: string; symbol: string; name: string; logo: string | null; chainIds: number[]; note?: string };

export default function ReceiveCard() {
  const params = useSearchParams();
  const { evmAddress, solanaAddress } = useRobankAccount();
  const [stocks, setStocks] = useState<ReceiveAsset[]>([]);
  const [assetId, setAssetId] = useState('stable:USDC');
  const [chainId, setChainId] = useState(8453);
  const [qr, setQr] = useState('');

  useEffect(() => {
    let active = true;
    api.stocks().then((data) => {
      if (!active) return;
      setStocks(data.stocks.map((s: any) => ({
        id: s.id, symbol: s.symbol, name: s.name, logo: s.logo,
        chainIds: s.networks.map((n: any) => n.chainId).filter((id: number) => chainById(id)),
        note: s.provider === 'robinhood' ? 'Robinhood Stock Token' : 'xStock'
      })).filter((s: ReceiveAsset) => s.chainIds.length));
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const assets = useMemo<ReceiveAsset[]>(() => [
    ...(['USDC', 'USDT', 'USDG'] as StableSymbol[]).map((symbol) => ({ id: `stable:${symbol}`, symbol, name: STABLE_META[symbol].name, logo: STABLE_META[symbol].logo, chainIds: STABLECOINS.filter((t) => t.symbol === symbol).map((t) => t.chainId) })),
    ...['ETH', 'SOL', 'BNB', 'POL'].map((symbol) => ({ id: `native:${symbol}`, symbol, name: 'Native gas token', logo: NATIVE_LOGOS[symbol], chainIds: CHAINS.filter((c) => c.native.symbol === symbol).map((c) => c.id) })),
    ...stocks
  ], [stocks]);

  // Deep links like /receive?asset=AAPLx&chain=ethereum from the Stocks page.
  useEffect(() => {
    const symbol = (params?.get('asset') || '').toLowerCase();
    if (!symbol) return;
    const chain = chainByKey(params?.get('chain'));
    const match = assets.find((a) => a.symbol.toLowerCase() === symbol && (!chain || a.chainIds.includes(chain.id))) || assets.find((a) => a.symbol.toLowerCase() === symbol);
    if (!match) return;
    setAssetId(match.id);
    setChainId(chain && match.chainIds.includes(chain.id) ? chain.id : match.chainIds[0]);
  }, [assets, params]);

  const asset = assets.find((a) => a.id === assetId) || assets[0];
  useEffect(() => { if (!asset.chainIds.includes(chainId)) setChainId(asset.chainIds[0]); }, [asset, chainId]);

  const chain = chainById(chainId)!;
  const address = chain.type === 'solana' ? solanaAddress : evmAddress;

  useEffect(() => {
    if (!address) { setQr(''); return; }
    QRCode.toDataURL(address, { width: 440, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#060708', light: '#f6f7f8' } }).then(setQr).catch(() => setQr(''));
  }, [address]);

  const assetOptions: PickerOption[] = assets.map((a) => ({ id: a.id, label: a.symbol, sub: a.note ? `${a.name} · ${a.note}` : a.name, image: a.logo }));
  const chainOptions: PickerOption[] = asset.chainIds.map((id) => ({ id: String(id), label: chainById(id)!.label, image: chainById(id)!.icon }));

  return (
    <div className="ui-grid" style={{ gap: 14 }}>
      <section className="ui-panel">
        <div className="ui-grid two">
          <Picker label="Asset you are receiving" value={assetOptions.find((o) => o.id === asset.id)} options={assetOptions} onChange={(o) => setAssetId(o.id)} />
          <Picker label="Network" value={chainOptions.find((o) => o.id === String(chainId))} options={chainOptions} onChange={(o) => setChainId(Number(o.id))} search={false} />
        </div>
      </section>

      <section className="ui-panel receive-panel">
        <div className="receive-qr">{qr ? <img src={qr} alt={`QR code for your ${chain.label} address`} /> : <Skeleton h={220} w={220} />}</div>
        <div className="receive-info">
          <span className="ui-kicker">Your {chain.label} address</span>
          <p className="receive-address ui-mono">{address || 'Your wallet is being prepared…'}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <CopyButton value={address} label="Copy address" disabled={!address} />
            {address && <a className="ui-btn ghost" href={explorerAddress(chainId, address)} target="_blank" rel="noreferrer">View on explorer ↗</a>}
          </div>
          <Alert tone="warn">Send only <b>{asset.symbol}</b> on <b>{chain.label}</b> to this address. Assets sent on another network may be lost.</Alert>
          {chain.type === 'evm' && <p className="ui-muted">The same EVM address works on Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Chain and Robinhood Chain — but each network is a separate balance.</p>}
          {asset.id.startsWith('stable:') || asset.id.startsWith('native:') ? null : <p className="ui-muted">Tokenized stocks can only be held by eligible users under the issuer&apos;s terms. Receiving them does not open a brokerage account.</p>}
        </div>
      </section>
    </div>
  );
}
