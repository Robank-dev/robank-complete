'use client';

import AppShell from '@/components/AppShell';
import AssetList from '@/components/AssetList';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export default function AssetsPage() {
  const { address } = useAccount();
  const [card, setCard] = useState<any>(null);

  useEffect(() => {
    api.cardStatus().then((data) => setCard(data.card)).catch(() => setCard(null));
  }, []);

  const cardBalance = card?.balance ?? card?.availableBalance ?? null;
  const cardActive = card?.status === 'active' || card?.status === 'issued';

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[.2em] text-white/35">ROBANK / ASSETS</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Your money.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Crypto you hold onchain and your ROBANK card, separated cleanly.</p>
          </div>
          <Link href="/markets" className="text-xs text-white/45 hover:text-white">Markets <span>→</span></Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.55fr_.95fr]">
          <section className="rounded-2xl border border-ro-line bg-ro-panel p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[.16em] text-white/30">PRIMARY WALLET</div>
                <h2 className="mt-2 text-xl font-medium">Assets you hold.</h2>
              </div>
              <span className="text-[9px] font-mono text-white/25">LIVE BALANCES</span>
            </div>
            <div className="mt-5">
              {!address ? <div className="rounded-xl border border-white/8 bg-black/10 p-5 text-sm text-white/40">Connect your ROBANK account to see your crypto holdings.</div> : <AssetList />}
            </div>
          </section>

          <section className="rounded-2xl border border-ro-line bg-ro-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-[.16em] text-white/30">ROBANK CARD</div>
                <h2 className="mt-2 text-xl font-medium">Card balance.</h2>
              </div>
              <span className="rounded-full border border-white/10 px-2.5 py-1 text-[8px] font-mono text-white/35">{cardActive ? 'ACTIVE' : 'NOT ISSUED'}</span>
            </div>

            <div className="mt-5 flex justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="virtual-card asset-virtual-card"><div className="card-surface">
                <div className="card-top"><span>ROBANK</span><span>VISA</span></div>
                <div className="card-chip"><span /><span /></div>
                <div className="card-logo"><img src="/robank-mark.png" alt="ROBANK" /></div>
                <div className="card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; ••••</div>
                <div className="card-meta"><div><small>CARDHOLDER</small><strong>ROBANK ACCOUNT</strong></div><div><small>EXPIRES</small><strong>PROVIDER</strong></div><div><small>CATEGORY</small><strong>ROBANK</strong></div></div>
                <div className="card-bottom"><span>ROBANK</span><span>VISA · DIGITAL</span></div><div className="card-shine" />
              </div></div>
            </div>

            <div className="mt-5 border-t border-white/8 pt-5">
              <div className="text-[9px] font-mono uppercase tracking-[.16em] text-white/25">BALANCE</div>
              <div className="mt-2 text-3xl font-semibold">{cardBalance != null ? `$${Number(cardBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}</div>
              <div className="mt-2 text-xs text-white/30">{cardBalance != null ? 'Provider-reported card balance.' : 'Card balance appears when the provider exposes a live balance.'}</div>
            </div>

            <Link href="/card" className="mt-5 inline-flex text-xs text-white/45 hover:text-white">Manage card <span className="ml-1">→</span></Link>
          </section>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/[.02] px-4 py-3 text-xs leading-5 text-white/30"><span className="font-medium text-white/55">Important:</span> Crypto values are wallet balances read from supported networks. Card balance is a separate provider balance and is not inferred from your crypto holdings.</div>
      </div>
    </AppShell>
  );
}
