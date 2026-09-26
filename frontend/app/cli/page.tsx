'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import CopyButton from '@/components/CopyButton';
import { Alert, Empty, Skeleton, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { friendlyError } from '@/lib/errors';
import { relativeTime } from '@/lib/format';

type Key = { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null };

const INSTALL = `git clone https://github.com/Robank-dev/robank-complete
npm install -g ./robank-complete/cli
robank login`;

const EXAMPLES = `robank balance
robank ask "what can I borrow against?"
robank send 25 USDC 0xRecipient… --chain base   # prints a review link, sends nothing
robank stocks tesla --json`;

function Keys() {
  const [keys, setKeys] = useState<Key[] | null>(null);
  const [error, setError] = useState('');
  const [name, setName] = useState('My laptop');
  const [created, setCreated] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { api.keys().then((r) => setKeys(r.keys)).catch((e) => setError(friendlyError(e, 'Keys could not be loaded.'))); }, []);
  useEffect(load, [load]);

  async function create() {
    setBusy(true);
    setError('');
    try {
      const { key, record } = await api.createKey(name.trim() || 'CLI');
      setCreated(key);
      setKeys((list) => [record, ...(list || [])]);
    } catch (e) {
      setError(friendlyError(e, 'The key could not be created.'));
    } finally {
      setBusy(false);
    }
  }
  async function revoke(id: string) {
    if (!window.confirm('Revoke this key? Anything using it will stop working immediately.')) return;
    try {
      await api.revokeKey(id);
      setKeys((list) => (list || []).filter((k) => k.id !== id));
    } catch (e) {
      setError(friendlyError(e, 'The key could not be revoked.'));
    }
  }

  return (
    <section className="ui-panel">
      <div className="ui-panel-head"><div><span className="ui-kicker">Personal API keys</span><h2>Access for the CLI and your agents</h2></div></div>
      <p className="ui-muted">A key can read your balances, talk to the agent and prepare transfers. It can never sign or send — that always happens here, in your wallet.</p>
      {created && (
        <div style={{ marginTop: 14 }}>
          <Alert tone="warn" title="Copy this key now.">It will not be shown again. Anyone with it can read your balances.</Alert>
          <div className="ui-row" style={{ borderTop: 0 }}><code className="ui-mono" style={{ flex: 1 }}>{created}</code><CopyButton value={created} label="Copy key" /></div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
        <input className="ui-input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} aria-label="Key name" />
        <button type="button" className="ui-btn primary" disabled={busy} onClick={() => void create()}>{busy ? <Spinner /> : 'Create key'}</button>
      </div>
      {error && <div style={{ marginTop: 12 }}><Alert tone="bad">{error}</Alert></div>}
      <div className="ui-rows" style={{ marginTop: 12 }}>
        {!keys ? <Skeleton h={48} /> : !keys.length ? <Empty title="No keys yet" /> : keys.map((k) => (
          <div className="ui-row" key={k.id}>
            <div className="ui-row-main"><b>{k.name}</b><span className="ui-mono">{k.prefix}… · created {relativeTime(k.createdAt)} · {k.lastUsedAt ? `used ${relativeTime(k.lastUsedAt)}` : 'never used'}</span></div>
            <button type="button" className="ui-btn danger sm" onClick={() => void revoke(k.id)}>Revoke</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function CliPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">CLI & API</span><h1>ROBANK from your terminal</h1><p>The CLI and API use the same rules as the app: they read and prepare, and you approve every transaction in your wallet.</p></div></header>
        <div className="ui-grid aside">
          <div className="ui-grid" style={{ alignContent: 'start' }}>
            <section className="ui-panel">
              <span className="ui-kicker">Install</span>
              <pre className="ui-code">{INSTALL}</pre>
              <CopyButton value={INSTALL} label="Copy commands" />
            </section>
            <section className="ui-panel">
              <span className="ui-kicker">Examples</span>
              <pre className="ui-code">{EXAMPLES}</pre>
              <p className="ui-muted">Add <code>--json</code> to any command for machine-readable output. Full reference in the <a className="ui-link" href="/docs#cli">docs</a>.</p>
            </section>
            <section className="ui-panel">
              <span className="ui-kicker">AI agent skill</span>
              <p className="ui-text" style={{ marginTop: 8 }}>Give Claude, Codex or other skill-compatible agents accurate ROBANK context:</p>
              <pre className="ui-code">npx skills add Robank-dev/robank-skill</pre>
            </section>
          </div>
          <Keys />
        </div>
      </div>
    </AppShell>
  );
}
