import AppShell from '@/components/AppShell';
import AgentTerminal from '@/components/AgentTerminal';

export const metadata = { title: 'AI Agent' };

export default function AgentPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">AI Agent</span><h1>Ask ROBANK</h1><p>The agent reads your live balances and prepares actions. Anything that moves money opens a review screen where only you can sign.</p></div></header>
        <div className="ui-grid aside">
          <AgentTerminal />
          <aside className="ui-grid" style={{ alignContent: 'start' }}>
            <section className="ui-panel">
              <span className="ui-kicker">What it can do</span>
              <ul className="agent-list">
                <li><b>Read balances</b> across every supported network, straight from the chain.</li>
                <li><b>Prepare transfers</b> — it fills in Send; you check the fee and sign.</li>
                <li><b>Explain</b> xStocks, Stock Tokens, borrowing and fees in plain language.</li>
                <li><b>Route you</b> to the right screen for borrowing, receiving or verification.</li>
              </ul>
            </section>
            <section className="ui-panel">
              <span className="ui-kicker">What it will never do</span>
              <ul className="agent-list">
                <li>Sign or send a transaction by itself.</li>
                <li>Claim something happened that has not been confirmed on-chain.</li>
                <li>Ask for your seed phrase, private key or password.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
