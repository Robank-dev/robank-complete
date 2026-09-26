'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { useAccount } from 'wagmi';
import { useWallets } from '@privy-io/react-auth';

type CardState = Awaited<ReturnType<typeof api.cardStatus>>['card'];

export default function CardPage() {
  const [card, setCard] = useState<CardState | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError, setKycError] = useState('');
  const [kycStarted, setKycStarted] = useState(false);
  const { address: wagmiAddress } = useAccount();
  const { wallets } = useWallets();
  const wallet = wallets.find((item) => item.walletClientType === 'privy');
  const address = wallet?.address || wagmiAddress;

  useEffect(() => { api.cardStatus().then((data) => setCard(data.card)).catch(() => setCard(null)); }, []);

  const active = card?.status === 'active' || card?.status === 'issued';

  async function apply() {
    if (!address) { setKycError('Connect your ROBANK account first.'); return; }
    setKycLoading(true); setKycError('');
    try {
      const result = await api.kycSession(address);
      setKycStarted(true);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setKycError(err instanceof Error ? err.message : 'Identity verification could not be started.');
    } finally { setKycLoading(false); }
  }

  return (
    <AppShell>
      <div className="card-page">
        <div className="ro-page-head card-page-head">
          <div><div className="ro-kicker">ROBANK / CARD</div><h1>ROBANK Card.</h1><p>One card for your spending rail, with the important terms shown up front.</p></div>
          <Link href="/money" className="card-back-link">Move money <span>→</span></Link>
        </div>

        <section className="card-hero-grid card-premium-hero">
          <div className="card-showcase">
            <div className="card-showcase-top"><span>ROBANK CARD</span><span>{active ? 'ACTIVE' : 'VISA'}</span></div>
            <div className="card-stage">
              <div className="card-3d-wrap"><div className="card-glow" /><div className="virtual-card"><div className="card-surface">
                <div className="card-top"><span>ROBANK</span><span>VISA</span></div>
                <div className="card-chip"><span /><span /></div>
                <div className="card-logo"><img src="/robank-mark.png" alt="ROBANK" /></div>
                <div className="card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; ••••</div>
                <div className="card-meta"><div><small>CARDHOLDER</small><strong>ROBANK ACCOUNT</strong></div><div><small>EXPIRES</small><strong>PROVIDER</strong></div><div><small>CATEGORY</small><strong>ROBANK</strong></div></div>
                <div className="card-bottom"><span>ROBANK</span><span>VISA · DIGITAL</span></div><div className="card-shine" />
              </div></div></div>
            </div>
            <div className="card-showcase-note"><span className={active ? 'card-live-dot active' : 'card-live-dot'} /><div><b>{active ? 'Card active' : 'Ready to apply'}</b><small>{card?.providerName || 'Buvei card rail'}</small></div></div>
          </div>

          <div className="card-status-panel">
            <div className="ro-kicker">CARD DETAILS</div>
            <h2>Visa spending card.</h2>
            <div className="card-status-list">
              <div><span>Card type</span><b>{card?.brand ? `${card.brand} Card` : 'Visa Card'}</b></div>
              <div><span>Fiat currency</span><b>{card?.currency || 'USD'}</b></div>
              <div><span>Issuing country</span><b>{card?.issuingCountry || 'Not available yet'}</b></div>
              <div><span>BIN series</span><b>{card?.bin || 'Not available yet'}</b></div>
              <div><span>KYC cardholder</span><b>{card?.requireKycCardholder == null ? 'Provider-dependent' : card.requireKycCardholder ? 'Required' : 'Not required'}</b></div>
              <div><span>Activation fee</span><b>$5.00</b></div>
              <div><span>KYC fee</span><b>$0.50</b></div>
              <div><span>Card category</span><b>ROBANK Card</b></div>
            </div>

            <details className="card-disclosure">
              <summary>Fees intro <span>⌄</span></summary>
              <div className="card-disclosure-body">
                <div><span>Card activation / creation</span><b>$5.00</b></div>
                <div><span>KYC verification</span><b>$0.50</b></div>
                <div><span>Successful card transaction</span><b>$0.50</b></div>
                <div><span>Declined authorization</span><b>$0.50</b></div>
                <p>Any additional provider fee is shown before the relevant action. Fraud-related charges, where applicable, are only imposed under the provider's rules.</p>
              </div>
            </details>

            <details className="card-disclosure">
              <summary>Card usage guide <span>⌄</span></summary>
              <div className="card-disclosure-body">
                <div><span>Daily usage / spending limit</span><b>Not available yet</b></div>
                <div><span>Top-up / funding</span><b>Provider-dependent</b></div>
                <div><span>Card payment</span><b>Visa merchant rail</b></div>
                <div><span>Refund / reversal</span><b>Provider lifecycle</b></div>
                <p>Actual limits and top-up fees are returned by the connected card program. ROBANK does not invent a limit when the provider has not supplied one.</p>
              </div>
            </details>

            <div className="mt-5 rounded-xl border border-white/8 bg-white/[.02] p-4">
              <div className="text-[9px] font-mono uppercase tracking-[.14em] text-white/25">CARD CATEGORY</div>
              <div className="mt-2 text-sm font-medium">ROBANK Card</div>
              <div className="mt-1 text-xs leading-5 text-white/30">Network brand: Visa · Product label: ROBANK · Provider: {card?.providerName || 'Buvei'}</div>
            </div>

            <button onClick={apply} disabled={kycLoading || !address || kycStarted} className="mt-5 w-full rounded-xl bg-white px-5 py-3.5 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-35">
              {kycLoading ? 'Opening verification…' : kycStarted ? 'Verification opened' : 'Apply Now →'}
            </button>
            {!address && <div className="mt-2 text-center text-[9px] text-white/25">Connect your ROBANK account to apply.</div>}
            {kycError && <div className="mt-3 rounded-xl border border-white/10 p-3 text-xs text-white/45">{kycError}</div>}
          </div>
        </section>

        <div className="rounded-xl border border-white/8 bg-white/[.02] px-4 py-3 text-xs leading-5 text-white/30"><span className="font-medium text-white/55">Important:</span> card issuance is still subject to provider availability, jurisdiction, KYC approval and the live BIN returned for the ROBANK program.</div>
      </div>
    </AppShell>
  );
}
