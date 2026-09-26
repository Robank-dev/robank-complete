import AppShell from '@/components/AppShell';
import OnchainStocks from '@/components/OnchainStocks';

export const metadata = { title: 'Stocks' };

export default function StocksPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">Stocks</span><h1>Tokenized stocks</h1><p>Browse xStocks and Robinhood Stock Tokens, see which ones you hold, and get the right address to receive them.</p></div></header>
        <OnchainStocks />
      </div>
    </AppShell>
  );
}
