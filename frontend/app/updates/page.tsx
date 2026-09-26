'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { Alert, Empty, Skeleton, Spinner } from '@/components/ui';
import { api, type Update } from '@/lib/api';
import { friendlyError } from '@/lib/errors';
import { relativeTime } from '@/lib/format';

function Updates() {
  const [updates, setUpdates] = useState<Update[] | null>(null);
  const [canPublish, setCanPublish] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({ title: '', body: '', xUrl: '', imageUrl: '' });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    setError('');
    api.updatesAsViewer().then((r) => { setUpdates(r.updates); setCanPublish(r.canPublish); }).catch((e) => setError(friendlyError(e, 'Updates could not be loaded.')));
  }, []);
  useEffect(load, [load]);

  async function publish() {
    setBusy(true);
    setFormError('');
    try {
      const { update } = await api.createUpdate({ title: draft.title || undefined, body: draft.body, xUrl: draft.xUrl || undefined, imageUrl: draft.imageUrl || undefined });
      setUpdates((list) => [update, ...(list || [])]);
      setDraft({ title: '', body: '', xUrl: '', imageUrl: '' });
    } catch (e) {
      setFormError(friendlyError(e, 'The update could not be published.'));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this update?')) return;
    try {
      await api.deleteUpdate(id);
      setUpdates((list) => (list || []).filter((u) => u.id !== id));
    } catch (e) {
      setError(friendlyError(e, 'The update could not be deleted.'));
    }
  }

  return (
    <div className="ui-grid" style={{ gap: 14 }}>
      {canPublish && (
        <section className="ui-panel">
          <span className="ui-kicker">Publish an update</span>
          <div className="ui-grid" style={{ gap: 10, marginTop: 12 }}>
            <input className="ui-input" maxLength={140} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title (optional)" />
            <textarea className="ui-textarea" maxLength={4000} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="What changed?" />
            <div className="ui-grid two" style={{ gap: 10 }}>
              <input className="ui-input" value={draft.xUrl} onChange={(e) => setDraft({ ...draft, xUrl: e.target.value })} placeholder="https://x.com/… (optional)" />
              <input className="ui-input" value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} placeholder="https://… image (optional)" />
            </div>
            {formError && <Alert tone="bad">{formError}</Alert>}
            <button type="button" className="ui-btn primary" disabled={busy || !draft.body.trim()} onClick={() => void publish()}>{busy ? <Spinner /> : 'Publish'}</button>
          </div>
        </section>
      )}
      {error && <Alert tone="bad" action={<button className="ui-btn secondary sm" onClick={load}>Retry</button>}>{error}</Alert>}
      {!updates && !error ? <Skeleton h={140} /> : updates && !updates.length ? <section className="ui-panel"><Empty title="No updates yet">Official ROBANK announcements will appear here.</Empty></section> : updates?.map((u) => (
        <article key={u.id} className="ui-panel">
          <div className="ui-panel-head">
            <div><span className="ui-kicker">{relativeTime(u.publishedAt)}</span>{u.title && <h2>{u.title}</h2>}</div>
            {canPublish && <button type="button" className="ui-btn ghost sm" onClick={() => void remove(u.id)}>Delete</button>}
          </div>
          <p className="ui-text" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{u.body}</p>
          {u.imageUrl && <img src={u.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" style={{ marginTop: 14, maxWidth: '100%', borderRadius: 14, border: '1px solid var(--ui-line)' }} />}
          {u.xUrl && <a className="ui-link" style={{ display: 'inline-block', marginTop: 12 }} href={u.xUrl} target="_blank" rel="noreferrer noopener">View post ↗</a>}
        </article>
      ))}
    </div>
  );
}

export default function UpdatesPage() {
  return (
    <AppShell>
      <div className="ui-page narrow">
        <header className="ui-head"><div><span className="ui-kicker">Updates</span><h1>What&apos;s new</h1><p>Official announcements from the ROBANK team.</p></div></header>
        <Updates />
      </div>
    </AppShell>
  );
}
