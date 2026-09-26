'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { api } from '@/lib/api';
import { loadDirectPortfolio } from '@/lib/portfolioClient';

type PortfolioAsset = {
  symbol: string;
  name: string;
  logo: string;
  quantity: number;
  valueUsd: number;
  assetType?: 'stablecoin' | 'xstock';
  network?: string;
  chainId?: number;
  contractAddress?: string;
  decimals?: number;
};

const SUPPORTED = ['USDC', 'USDT', 'USDG'] as const;

const STABLE_SYMBOLS = new Set(['USDC', 'USDT', 'USDG']);
const DEFAULT_ASSETS: PortfolioAsset[] = [
  { symbol: 'USDC', name: 'USDC', logo: '/token-icons/usdc.svg', quantity: 0, valueUsd: 0, assetType: 'stablecoin' },
  { symbol: 'USDT', name: 'USDT', logo: '/token-icons/usdt.svg', quantity: 0, valueUsd: 0, assetType: 'stablecoin' },
  { symbol: 'USDG', name: 'USDG', logo: '/token-icons/usdg.png', quantity: 0, valueUsd: 0, assetType: 'stablecoin' }
];

function formatAmount(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 6
  });
}

function formatUsd(value: number) {
  return '$' + value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function AssetRow({ asset }: { asset: PortfolioAsset }) {
  return (
    <div className="asset-row asset-row-unified">
      <div className="asset-symbol-wrap">
        <div className="asset-symbol overflow-hidden bg-white/5 p-1.5">
          <img
            src={asset.logo}
            alt=""
            className="h-full w-full rounded-full object-contain"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>

      <div className="asset-name">
        <b>{asset.symbol}</b>
        {asset.assetType === 'xstock' && (
          <span>{asset.name}{asset.network ? ' · ' + asset.network : ''}</span>
        )}
      </div>
      <div className="asset-quantity">
        <b>{formatAmount(asset.quantity)}</b>
        <span>Quantity</span>
      </div>
      <div className="asset-value">
        <b>{formatUsd(asset.valueUsd)}</b>
        <span>Value</span>
      </div>
    </div>
  );
}

export default function AssetList() {
  const { user } = usePrivy();
  const linkedAccounts = (Array.isArray(user?.linkedAccounts) ? user.linkedAccounts : []) as Array<{
    type?: string;
    walletClientType?: string;
    chainType?: string;
    address?: string;
  }>;
  const evmAddress = linkedAccounts.find(
    (account) =>
      account.type === 'wallet' &&
      account.walletClientType === 'privy' &&
      account.chainType === 'ethereum' &&
      Boolean(account.address)
  )?.address || '';
  const solanaAddress = linkedAccounts.find(
    (account) =>
      account.type === 'wallet' &&
      account.walletClientType === 'privy' &&
      account.chainType === 'solana' &&
      Boolean(account.address)
  )?.address || '';
  const [assets, setAssets] = useState<PortfolioAsset[]>(DEFAULT_ASSETS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!evmAddress && !solanaAddress) {
        setAssets([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      let serverAssets: PortfolioAsset[] = [];
      let directAssets: PortfolioAsset[] = [];
      let settled = 0;
      let rejected = 0;

      const finish = () => {
        settled += 1;
        if (cancelled) return;

        const stableMap = new Map<string, PortfolioAsset>();
        for (const asset of DEFAULT_ASSETS) stableMap.set(asset.symbol, asset);

        for (const asset of [...serverAssets, ...directAssets]) {
          if (!STABLE_SYMBOLS.has(asset.symbol)) continue;
          const current = stableMap.get(asset.symbol);
          if (!current || asset.quantity > current.quantity) {
            stableMap.set(asset.symbol, asset);
          }
        }

        const stableAssets = [...stableMap.values()];
        const xstockMap = new Map<string, PortfolioAsset>();
        for (const asset of serverAssets) {
          if (asset.assetType !== 'xstock' || asset.quantity <= 0) continue;
          const key = asset.symbol + ':' + String(asset.chainId || '') + ':' + String(asset.contractAddress || asset.network || '');
          const current = xstockMap.get(key);
          if (!current || asset.quantity > current.quantity) xstockMap.set(key, asset);
        }
        const merged = [...stableAssets, ...xstockMap.values()]
          .sort((a, b) => b.valueUsd - a.valueUsd);

        // Paint immediately as each source resolves, without dropping back to zero.
        setAssets(merged);
        setLoading(settled < 2);
        if (settled === 2 && rejected === 2) {
          setError('Portfolio data unavailable');
        }
      };

      void api.portfolio(evmAddress, solanaAddress)
        .then((data) => {
          if (cancelled) return;
          serverAssets = (data.assets || [])
            .map((asset) => ({
              ...asset,
              symbol: String(asset.symbol)
            }))
            .filter((asset) => asset.assetType === 'xstock' || STABLE_SYMBOLS.has(asset.symbol));
          finish();
        })
        .catch(() => {
          rejected += 1;
          finish();
        });

      void loadDirectPortfolio(evmAddress, solanaAddress)
        .then((data) => {
          if (cancelled) return;
          directAssets = data.assets
            .map((asset) => ({ ...asset, symbol: String(asset.symbol) }))
            .filter((asset) => STABLE_SYMBOLS.has(asset.symbol));
          finish();
        })
        .catch(() => {
          rejected += 1;
          finish();
        });
    }

    // Load once when the address becomes available. No background polling:
    // repeated RPC reads can race and briefly replace a real balance with zero.
    void load();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && document.hidden === false) {
        void load();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [evmAddress, solanaAddress]);

  if (!evmAddress && !solanaAddress) return null;

  return (
    <div className="asset-list">
      {assets.map((asset) => <AssetRow key={asset.symbol} asset={asset} />)}
    </div>
  );
}
