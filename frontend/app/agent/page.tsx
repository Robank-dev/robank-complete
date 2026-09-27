import AppShell from '@/components/AppShell';
import AgentTerminal from '@/components/AgentTerminal';

export const metadata = { title: 'AI Agent' };

export default function AgentPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">AI Agent</span><h1>Ask ROBANK</h1><p>The agent reads your live balances and prepares actions right in the chat. Anything that moves money waits for your Confirm.</p></div></header>
        <div className="ui-grid aside">
          <AgentTerminal />
          <aside className="ui-grid" style={{ alignContent: 'start' }}>
            <section className="ui-panel">
              <span className="ui-kicker">What it can do</span>
              <ul className="agent-list">
                <li><b>Read your balance</b> on Robinhood Chain, straight from the chain.</li>
                <li><b>Send USDG or ETH</b> — it prepares the transfer; you press Send and confirm.</li>
                <li><b>Buy and sell Stock Tokens</b> with a live quote, or cancel.</li>
                <li><b>Explain</b> Stock Tokens, borrowing, the card and fees in plain language.</li>
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
