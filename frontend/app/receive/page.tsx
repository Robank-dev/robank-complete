import { Suspense } from 'react';
import AppShell from '@/components/AppShell';
import ReceiveCard from '@/components/ReceiveCard';

export const metadata = { title: 'Receive' };

export default function ReceivePage() {
  return (
    <AppShell>
      <div className="ui-page narrow">
        <header className="ui-head"><div><span className="ui-kicker">Receive</span><h1>Your deposit address</h1><p>Your ROBANK address on Robinhood Chain. Share it or scan the QR code to deposit any token on Robinhood Chain.</p></div></header>
        <Suspense fallback={null}><ReceiveCard /></Suspense>
      </div>
    </AppShell>
  );
}
