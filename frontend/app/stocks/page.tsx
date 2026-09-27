import AppShell from '@/components/AppShell';
import OnchainStocks from '@/components/OnchainStocks';

export const metadata = { title: 'Stocks' };

export default function StocksPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">Stocks</span><h1>Stock Tokens</h1><p>Browse Robinhood Stock Tokens on Robinhood Chain, see which ones you hold, and receive or send them.</p></div></header>
        <OnchainStocks />
      </div>
    </AppShell>
  );
}
