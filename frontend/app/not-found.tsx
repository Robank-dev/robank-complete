import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="login">
      <section className="ui-panel login-card" style={{ textAlign: 'center', display: 'grid', gap: 12 }}>
        <span className="ui-kicker">404</span>
        <h1>Page not found</h1>
        <p className="ui-muted">This page does not exist or has moved.</p>
        <Link href="/dashboard" className="ui-btn primary">Go to Overview</Link>
        <Link href="/" className="ui-link">Home</Link>
      </section>
    </main>
  );
}
