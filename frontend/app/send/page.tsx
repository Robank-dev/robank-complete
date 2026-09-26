import { Suspense } from 'react';
import AppShell from '@/components/AppShell';
import SendForm from '@/components/SendForm';

export const metadata = { title: 'Send' };

export default function SendPage() {
  return (
    <AppShell>
      <div className="ui-page narrow">
        <header className="ui-head"><div><span className="ui-kicker">Send</span><h1>Send assets</h1><p>Send to any address on the same network, or move stablecoins across networks through LI.FI. You review every detail before signing.</p></div></header>
        <Suspense fallback={null}><SendForm /></Suspense>
      </div>
    </AppShell>
  );
}
