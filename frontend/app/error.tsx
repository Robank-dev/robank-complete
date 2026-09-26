'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('[robank] page error', error.digest || error.message); }, [error]);
  return (
    <main className="login">
      <section className="ui-panel login-card" style={{ textAlign: 'center', display: 'grid', gap: 12 }}>
        <span className="ui-kicker">Something went wrong</span>
        <h1>This screen failed to load</h1>
        <p className="ui-muted">No transaction was sent. Try again, or reload the page.</p>
        <button type="button" className="ui-btn primary" onClick={reset}>Try again</button>
        <button type="button" className="ui-link" onClick={() => window.location.reload()}>Reload page</button>
      </section>
    </main>
  );
}
