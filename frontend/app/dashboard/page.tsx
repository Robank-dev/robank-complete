'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import AssetList from '@/components/AssetList';
import CopyButton from '@/components/CopyButton';
import { usePrivy } from '@privy-io/react-auth';
import { api } from '@/lib/api';
import { loadDirectPortfolio } from '@/lib/portfolioClient';

function short(value?: string) {
  return value ? value.slice(0, 8) + '…' + value.slice(-6) : '';
}

function UiIcon({ name }: { name: string }) {
  const common = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<string, React.ReactNode> = {
    edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
    send: <><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></>,
    receive: <><path d="M12 5v14"/><path d="m18 13-6 6-6-6"/></>,
    wallet: <><path d="M4 7V5a2 2 0 0 1 2-2h12"/><rect x="3" y="6" width="18" height="15" rx="2"/><path d="M16 13h3"/></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/><path d="M7 15h4"/></>,
    agent: <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z"/></>,
    borrow: <><path d="M4 7h16"/><path d="M7 7v10M17 7v10"/><path d="M4 17h16"/><path d="M9 12h6"/></>,
    stocks: <><path d="M4 19V5h16v14H4z"/><path d="M8 16v-4M12 16V8M16 16v-6"/></>,
    market: <><path d="M4 19V10M10 19V5M16 19v-8M22 19H2"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
    gift: <><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M12 8v12M3 12h18M5 8h14M8 8c-2.2 0-3.3-3.2-.8-3.2 2.3 0 4.8 3.2 4.8 3.2M16 8c2.2 0 3.3-3.2.8-3.2-2.3 0-4.8 3.2-4.8 3.2"/></>
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export default function Dashboard() {
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
  const address = evmAddress;
  const [portfolioTotal, setPortfolioTotal] = useState<number | null>(null);
  const [name, setName] = useState('User');
  const [card, setCard] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) {
      setName('User');
      return;
    }
    try {
      const saved = JSON.parse(localStorage.getItem('robank.profile.' + user.id) || '{}');
      setName(typeof saved.name === 'string' && saved.name.trim() ? saved.name.trim() : 'User');
    } catch {
      setName('User');
    }
  }, [user?.id]);



  useEffect(() => {
    let cancelled = false;
    async function loadPortfolio() {
      if (!address && !solanaAddress) {
        setPortfolioTotal(null);
        return;
      }
      let serverTotal = 0;
      let directTotal = 0;
      let settled = 0;

      const finish = () => {
        settled += 1;
        if (cancelled) return;

        const nextTotal = directTotal > 0 ? directTotal : serverTotal;
        // Never replace a known/unknown balance with a temporary zero while the
        // second source is still resolving. Only show $0 once both reads finish.
        if (nextTotal > 0 || settled === 2) {
          setPortfolioTotal(nextTotal);
        }
      };

      void api.portfolio(address, solanaAddress)
        .then((data) => {
          if (cancelled) return;
          serverTotal = Number(data.totalUsd || 0);
          finish();
        })
        .catch(() => finish());

      void loadDirectPortfolio(address, solanaAddress)
        .then((data) => {
          if (cancelled) return;
          directTotal = Number(data.totalUsd || 0);
          finish();
        })
        .catch(() => finish());
    }
    // Load on entry/address change and when returning to the tab.
    // Do not poll in the background: RPC reads can race and flash stale zeroes.
    void loadPortfolio();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && document.hidden === false) {
        void loadPortfolio();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [address, solanaAddress]);

  useEffect(() => {
    api.cardStatus().then((data) => setCard(data.card)).catch(() => setCard(null));
  }, []);

  const cardIssued = card?.status === 'active' || card?.status === 'issued';

  return (
    <AppShell>
      <div className="ro-overview-premium">
        <section className="ro-total-hero">
          <div className="ro-total-balance">
            <span className="ro-kicker">{name}</span>
            <strong>{portfolioTotal === null ? 'Loading…' : '$' + portfolioTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
          <div className="ro-total-actions">
            <Link href="/send"><span className="ro-action-icon"><UiIcon name="send" /></span><b>Send</b></Link>
            <Link href="/receive"><span className="ro-action-icon"><UiIcon name="receive" /></span><b>Receive</b></Link>
            <button type="button" className="ro-total-action-disabled" disabled aria-label="Top up coming soon"><span className="ro-action-icon"><UiIcon name="wallet" /></span><b>Top up</b><small>SOON</small></button>
            <button type="button" className="ro-total-action-disabled" disabled aria-label="Giveaway coming soon"><span className="ro-action-icon"><UiIcon name="gift" /></span><b>Giveaway</b><small>SOON</small></button>
          </div>
          <div className="ro-total-glow"><i /><i /><i /></div>
        </section>

        <section className="ro-overview-premium-grid">
          <div className="ro-liquidity-card">
            <div className="ro-premium-section-head"><div><span className="ro-kicker">ASSETS</span><h2>Your holdings.</h2></div><span className="ro-section-status"><UiIcon name="wallet" /> LIVE</span></div>
            {address || solanaAddress ? <AssetList /> : <div className="ro-empty"><strong>Wallets are being prepared.</strong><span>Your embedded wallets will appear here once ready.</span></div>}
          </div>

          <div className="ro-card-status-premium">
            <div className="ro-premium-section-head"><div><span className="ro-kicker">ROBANK CARD</span><h2>{cardIssued ? 'Ready to spend.' : 'Build your card rail.'}</h2></div><span>{cardIssued ? 'ACTIVE' : 'PENDING'}</span></div>
            <div className="ro-mini-card-visual"><div className="ro-mini-card-top"><span>ROBANK</span><span>VISA</span></div><div className="ro-mini-card-chip" /><div className="ro-mini-card-number">••••  ••••  ••••  ••••</div><div className="ro-mini-card-bottom"><span>{name}</span><span>USD</span></div></div>
            <p>{cardIssued ? 'Your provider-issued card is active.' : 'Identity verification and provider availability determine issuance.'}</p>
            <Link href="/card" className="ro-premium-link"><UiIcon name="card" /> Open Card <b>→</b></Link>
          </div>
        </section>

        <section className="ro-overview-lower">
          <div className="ro-wallet-premium">
            <div className="ro-premium-section-head"><div><span className="ro-kicker">WALLETS</span><h2>Your addresses.</h2></div></div>
            <div className="ro-wallet-address-row"><span className="ro-wallet-type-icon evm"><img src="/token-icons/ethereum.png" alt="Ethereum" /></span><div><strong>{address ? short(address) : '—'}</strong></div><CopyButton value={address} label="Copy" disabled={!address} /></div>
            <div className="ro-wallet-address-row secondary"><span className="ro-wallet-type-icon sol"><img src="/chain-icons/solana.svg" alt="Solana" /></span><div><strong>{solanaAddress ? short(solanaAddress) : '—'}</strong></div><CopyButton value={solanaAddress} label="Copy" disabled={!solanaAddress} /></div>
          </div>

          <div className="ro-agent-premium">
            <div className="ro-premium-section-head"><div><span className="ro-kicker">AI AGENT</span><h2>Operate with intent.</h2></div><span className="ro-agent-pulse" /></div>
            <p>Ask ROBANK to inspect supported balances, prepare actions and route you to the right provider before anything moves.</p>
            <Link href="/agent" className="ro-premium-link"><UiIcon name="agent" /> Open Agent <b>→</b></Link>
          </div>
        </section>

        <section className="ro-overview-rail">
          <Link href="/borrow"><span className="ro-rail-icon"><UiIcon name="borrow" /></span><div><b>Borrow</b><small>Provider-backed liquidity.</small></div><em>→</em></Link>
          <Link href="/xstocks"><span className="ro-rail-icon"><UiIcon name="stocks" /></span><div><b>xStocks</b><small>Supported onchain stock products.</small></div><em>→</em></Link>
          <Link href="/markets"><span className="ro-rail-icon"><UiIcon name="market" /></span><div><b>Agent Market</b><small>Services and machine-payable tools.</small></div><em>→</em></Link>
        </section>
      </div>
      <style jsx global>{`
.ro-overview-premium{max-width:1280px!important;padding:8px 0 64px!important}
.ro-overview-profilebar{display:flex;align-items:center;justify-content:space-between;gap:28px;margin-bottom:18px;padding:6px 2px}
.ro-profile-identity{display:flex;align-items:center;gap:18px;min-width:0}.ro-profile-avatar{width:64px;height:64px;border-radius:18px;display:grid;place-items:center;overflow:hidden;color:#dce1e7;background:linear-gradient(145deg,#171a1e,#08090a);border:1px solid rgba(255,255,255,.13);box-shadow:0 16px 45px rgba(0,0,0,.3)}.ro-profile-avatar img{width:100%;height:100%;object-fit:cover}
.ro-profile-identity h1{margin:5px 0 2px;font-size:clamp(30px,3.4vw,46px);line-height:1;letter-spacing:-.055em;font-weight:560;color:#f4f5f6}.ro-profile-identity p{margin:8px 0 0;color:#8b929b;font-size:14px}
.ro-edit-profile{display:inline-flex!important;align-items:center;justify-content:center;gap:9px;height:46px;padding:0 17px;border:1px solid rgba(255,255,255,.13);border-radius:13px;background:rgba(255,255,255,.035);color:#e8eaed;font-size:13px;font-weight:560;cursor:pointer}.ro-edit-profile svg{width:17px;height:17px}
.ro-total-hero{min-height:236px!important;height:236px!important;padding:22px 28px 20px!important;border-radius:26px!important;position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:1fr auto;gap:16px;align-items:stretch}.ro-total-hero .ro-kicker{font-size:11px;letter-spacing:.18em;color:#a7afb9}.ro-total-hero strong{font-size:clamp(58px,7vw,86px)!important;font-weight:520;font-variant-numeric:tabular-nums;letter-spacing:-.055em;line-height:.95}.ro-total-hero small{font-size:13px;letter-spacing:.02em;color:#89919a}.ro-total-balance{position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center;padding:2px 0}.ro-total-actions{position:relative;z-index:2;display:flex;align-items:flex-end;gap:30px;padding-top:10px}.ro-total-actions>a{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-width:64px;padding:0;border:0;background:transparent;color:#fff;text-decoration:none;transition:transform .18s ease,opacity .18s ease}.ro-total-actions>a:hover{transform:translateY(-1px);opacity:.86}.ro-total-actions .ro-action-icon{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.085);border:1px solid rgba(255,255,255,.06);box-shadow:0 8px 22px rgba(0,0,0,.25)}.ro-total-action-disabled{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;min-width:64px;padding:0;border:0;background:transparent;color:#6f7780;cursor:not-allowed;opacity:.58}.ro-total-action-disabled .ro-action-icon{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.05);box-shadow:none}.ro-total-action-disabled .ro-action-icon svg{width:20px;height:20px}.ro-total-action-disabled b{font-size:12px;font-weight:500;color:#828a93}.ro-total-action-disabled small{font-size:8px;letter-spacing:.12em;color:#4f575f;margin-top:-3px}@media(max-width:640px){.ro-total-action-disabled{min-width:58px}.ro-total-action-disabled .ro-action-icon{width:42px;height:42px}}.ro-total-actions .ro-action-icon svg{width:20px;height:20px}.ro-total-actions b{font-size:12px;font-weight:500}.ro-total-actions div span{display:none}.ro-total-actions em{display:none}.ro-action-row{margin:0}.ro-action-icon{width:44px;height:44px;border-radius:13px}
.ro-overview-premium-grid{grid-template-columns:1.45fr .55fr!important;gap:14px}.ro-overview-lower{grid-template-columns:1.35fr .65fr!important;gap:14px;margin-top:14px}.ro-liquidity-card,.ro-card-status-premium,.ro-wallet-premium,.ro-agent-premium{padding:26px;border-radius:21px}.ro-premium-section-head h2{font-size:22px;line-height:1.1;letter-spacing:-.035em;margin-top:7px}
.ro-section-link{display:inline-flex;align-items:center;gap:7px;color:#aeb5bd;text-decoration:none;font-size:12px}.ro-section-link svg{width:16px;height:16px}.ro-section-status{display:inline-flex;align-items:center;gap:7px;color:#8f969f;font-size:10px;letter-spacing:.14em}.ro-section-status svg{width:15px;height:15px}
.ro-liquidity-card .asset-list{margin-top:12px}.ro-liquidity-card .asset-row{min-height:66px;padding:10px 2px}.ro-liquidity-card .asset-symbol{width:44px;height:44px}.ro-liquidity-card .asset-name b,.ro-liquidity-card .asset-quantity b,.ro-liquidity-card .asset-value b{font-size:18px!important;font-weight:600}.ro-liquidity-card .asset-name span,.ro-liquidity-card .asset-quantity span,.ro-liquidity-card .asset-value span{font-size:13px!important;margin-top:4px}.ro-liquidity-card .asset-quantity b,.ro-liquidity-card .asset-value b{font-size:17px!important}.ro-liquidity-card .asset-row{padding:10px 2px}.ro-liquidity-card .asset-symbol{width:46px;height:46px}
.ro-mini-card-visual{min-height:190px;margin-top:20px;padding:23px;border-radius:19px}.ro-card-status-premium p,.ro-agent-premium p{font-size:13px;line-height:1.7}.ro-premium-link{align-items:center;font-size:13px;padding:10px 0}.ro-premium-link svg{width:17px;height:17px}
.ro-wallet-address-row{min-height:76px;padding:12px 0}.ro-wallet-address-row strong{font-size:14px}.ro-wallet-type-icon{width:48px;height:48px;display:grid;place-items:center;flex:none;border:1px solid rgba(255,255,255,.15);border-radius:14px;background:rgba(255,255,255,.06);box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 10px 28px rgba(0,0,0,.24)}.ro-wallet-type-icon img{width:29px;height:29px;object-fit:contain;display:block}.ro-wallet-type-icon.evm img{filter:brightness(0) invert(1);width:31px;height:31px}.ro-wallet-type-icon.sol img{width:31px;height:31px}.ro-wallet-retry{border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#fff;border-radius:10px;padding:9px 13px;font-size:11px;font-weight:600;cursor:pointer}
.ro-overview-rail{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}.ro-overview-rail>a{display:flex;align-items:center;gap:15px;min-height:86px;padding:16px 18px;border:1px solid rgba(255,255,255,.1);border-radius:18px;background:rgba(255,255,255,.025);color:#fff;text-decoration:none}.ro-rail-icon{width:42px;height:42px;display:grid;place-items:center;flex:none;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:#0b0d0f;color:#c7cdd4}.ro-overview-rail b{display:block;font-size:14px}.ro-overview-rail small{display:block;margin-top:5px;color:#7d858e;font-size:11px}.ro-overview-rail em{margin-left:auto;font-size:19px;color:#777f88;font-style:normal}
.ro-profile-modal-backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,.68);backdrop-filter:blur(14px)}.ro-profile-modal{position:relative;width:min(600px,100%);padding:30px;border:1px solid rgba(255,255,255,.13);border-radius:24px;background:linear-gradient(145deg,#111417,#090a0c);box-shadow:0 40px 120px rgba(0,0,0,.65)}.ro-profile-close{position:absolute;right:18px;top:18px;width:38px;height:38px;border:1px solid rgba(255,255,255,.1);border-radius:11px;background:rgba(255,255,255,.03);color:#aeb5bd;display:grid;place-items:center;cursor:pointer}.ro-profile-modal-head h2{margin:9px 0 5px;font-size:27px;letter-spacing:-.04em}.ro-profile-modal-head p{margin:0;color:#7f8790;font-size:13px}.ro-profile-editor{display:grid;grid-template-columns:150px 1fr;gap:22px;align-items:center;margin-top:28px}.ro-photo-picker{position:relative;width:150px;height:150px;display:grid;place-items:center;border:1px dashed rgba(255,255,255,.18);border-radius:22px;background:rgba(255,255,255,.025);color:#8e969f;overflow:hidden;cursor:pointer}.ro-photo-picker img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.ro-photo-picker span{position:absolute;bottom:10px;padding:5px 8px;border-radius:7px;background:rgba(0,0,0,.65);color:#fff;font-size:10px}.ro-photo-picker input{display:none}.ro-profile-field span{display:block;margin-bottom:9px;color:#7d858e;font:10px ui-monospace;letter-spacing:.16em}.ro-profile-field input{width:100%;height:52px;padding:0 15px;border:1px solid rgba(255,255,255,.12);border-radius:13px;background:#070809;color:#fff;outline:none;font-size:16px}.ro-profile-modal-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:28px}.ro-profile-modal-actions button{height:44px;padding:0 16px;border-radius:11px;font-size:12px;font-weight:600;cursor:pointer}.ro-profile-cancel{border:1px solid rgba(255,255,255,.1);background:transparent;color:#9ba2aa}.ro-profile-save{display:inline-flex;align-items:center;gap:8px;border:0;background:#f2f3f4;color:#08090a}.ro-profile-save svg{width:16px;height:16px}
.ro-account-avatar img{width:100%;height:100%;object-fit:cover}.ro-account-copy b{font-size:13px}.ro-account-copy small{font-size:10px}
@media(max-width:900px){.ro-overview-profilebar{align-items:flex-start}.ro-profile-identity h1{font-size:34px}.ro-overview-premium-grid,.ro-overview-lower,.ro-overview-rail{grid-template-columns:1fr!important}.ro-total-hero{height:248px!important;min-height:248px!important;padding:20px 22px 18px!important}.ro-total-actions{gap:26px}.ro-total-actions .ro-action-icon{width:44px;height:44px}.ro-profile-editor{grid-template-columns:1fr}.ro-photo-picker{width:120px;height:120px}}
@media(max-width:640px){.ro-overview-profilebar{flex-direction:column}.ro-edit-profile{width:100%}.ro-total-hero{height:218px!important;min-height:218px!important;padding:18px 18px 16px!important;gap:12px}.ro-total-hero strong{font-size:52px!important}.ro-total-actions{gap:20px;justify-content:flex-start}.ro-total-actions>a{min-width:58px}.ro-total-actions .ro-action-icon{width:42px;height:42px}.ro-profile-modal{padding:24px}.ro-profile-modal-actions{flex-direction:column}.ro-profile-modal-actions button{width:100%}}
`}</style>
    </AppShell>
  );
}
