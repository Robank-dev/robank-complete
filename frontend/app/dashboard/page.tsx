'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AppShell from '@/components/AppShell';
import AssetList from '@/components/AssetList';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { api } from '@/lib/api';

function short(value?: string) { return value ? `${value.slice(0, 6)}…${value.slice(-4)}` : ''; }

function ActionIcon({ type }: { type: 'send' | 'receive' | 'card' }) {
  const glyph = type === 'send' ? '↑' : type === 'receive' ? '↓' : '▣';
  return <span className="ro-action-icon">{glyph}</span>;
}

export default function Dashboard() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets.find((item) => item.walletClientType === 'privy');
  const address = wallet?.address;
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [card, setCard] = useState<Awaited<ReturnType<typeof api.cardStatus>>['card'] | null>(null);

  const profileKey = useMemo(() => user?.id ? `robank.profile.${user.id}` : '', [user?.id]);
  const fallbackName = user?.email?.address?.split('@')[0] || 'there';

  useEffect(() => {
    if (!profileKey) return;
    const saved = localStorage.getItem(profileKey) || '';
    setName(saved);
    setDraft(saved);
  }, [profileKey]);

  useEffect(() => {
    api.cardStatus().then((data) => setCard(data.card)).catch(() => setCard(null));
  }, []);

  const saveName = () => {
    const value = draft.trim().slice(0, 40);
    if (profileKey) {
      if (value) localStorage.setItem(profileKey, value);
      else localStorage.removeItem(profileKey);
      setName(value);
      window.dispatchEvent(new Event('robank-profile-updated'));
    }
    setEditing(false);
  };

  const cardIssued = card?.status === 'active' || card?.status === 'issued';
  const cardReady = Boolean(card?.operations?.issue);

  return (
    <AppShell>
      <div className="ro-dashboard-head">
        <div>
          <div className="ro-kicker">OVERVIEW</div>
          <h1>Good to see you, <span>{name || fallbackName}</span>.</h1>
          <p>Your capital, wallets and operating rails in one place.</p>
        </div>
        <button className="ro-edit-profile" onClick={() => { setDraft(name); setEditing(true); }}>Edit profile</button>
      </div>

      {editing && <div className="ro-profile-popover">
        <div><span className="ro-kicker">PROFILE</span><strong>Choose your display name.</strong><small>This replaces the email-derived name across ROBANK.</small></div>
        <div className="ro-profile-form"><input autoFocus value={draft} maxLength={40} onChange={(e) => setDraft(e.target.value)} placeholder="Your name" onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditing(false); }} /><button onClick={saveName}>Save</button></div>
      </div>}

      <section className="ro-balance-strip">
        <div><span className="ro-kicker">TOTAL BALANCE</span><strong>—</strong><small>Live portfolio value will appear as pricing is connected.</small></div>
        <div className="ro-balance-network"><span className="ro-network-badge"><img src="/chain-icons/base.svg" alt="" /> Base</span><span className="ro-network-badge"><img src="/chain-icons/robinhood.svg" alt="" /> Robinhood Chain</span></div>
      </section>

      <section className="ro-overview-grid">
        <div className="ro-overview-main">
          <div className="ro-wallet-card">
            <div className="ro-wallet-top"><span className="ro-kicker">PRIMARY WALLET</span><span>{address ? 'READY' : 'CREATING'}</span></div>
            <div className="ro-wallet-row"><div><strong>{address ? short(address) : 'Preparing your wallet'}</strong><small>{address ? 'Privy embedded EVM wallet' : 'One wallet across supported EVM networks'}</small></div>{address && <button className="ro-copy-address" onClick={() => navigator.clipboard?.writeText(address)}>Copy</button>}</div>
            <div className="ro-wallet-actions"><Link href="/send"><ActionIcon type="send" /><span>Send</span></Link><Link href="/receive"><ActionIcon type="receive" /><span>Receive</span></Link><Link href="/assets"><ActionIcon type="card" /><span>Assets</span></Link></div>
          </div>

          <div className="ro-assets-card">
            <div className="ro-section-head"><div><span className="ro-kicker">ASSETS</span><h2>Your assets</h2></div><Link href="/assets">View all <b>→</b></Link></div>
            {address ? <AssetList /> : <div className="ro-empty"><strong>Wallet is being prepared.</strong><span>Your EVM wallet will appear here once Privy finishes creation.</span></div>}
          </div>
        </div>

        <div className="ro-overview-side">
          <div className={`ro-card-status ${cardIssued ? 'issued' : ''}`}>
            <div className="ro-section-head"><div><span className="ro-kicker">ROBANK CARD</span><h2>{cardIssued ? 'Your card is ready.' : 'Your card is not issued.'}</h2></div><span className="ro-card-state">{cardIssued ? 'ACTIVE' : 'NOT ISSUED'}</span></div>
            {cardIssued ? <><div className="ro-card-preview issued"><span>ROBANK</span><b>•••• 4821</b><small>{name || 'ROBANK USER'}</small></div><Link href="/card" className="ro-card-link">Manage card <b>→</b></Link></> : <><div className="ro-card-preview empty"><span>ROBANK</span><i>+</i><small>{cardReady ? 'Ready to request' : 'Provider connection required'}</small></div><p>{cardReady ? 'Request your ROBANK Card when you are ready.' : 'Card issuance will appear here when the provider rail is available.'}</p><Link href="/card" className="ro-card-link">View card <b>→</b></Link></>}
          </div>

          <div className="ro-agent-card"><div className="ro-section-head"><div><span className="ro-kicker">AI AGENT</span><h2>Operate with intent.</h2></div><span className="ro-agent-dot" /></div><p>Ask ROBANK to inspect balances, prepare actions and guide approved execution.</p><Link href="/agent" className="ro-card-link">Open Agent <b>→</b></Link></div>
        </div>
      </section>


    </AppShell>
  );
}
