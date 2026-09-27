'use client';

import { useLoop, useTypewriter } from '@/components/LandingFx';

/* Illustrations for the marketing pages. All values are examples. */

export function HoldingsVisual() {
  return (
    <div className="v-hold">
      <div className="v-hold-head">
        <span>Portfolio</span>
        <div className="v-net"><img src="/chain-icons/robinhood.svg" alt="" />Robinhood Chain</div>
      </div>
      <div className="v-hold-total"><strong>$12,840.52</strong><span>+2.4%</span></div>
      <svg className="v-spark" viewBox="0 0 300 64" preserveAspectRatio="none">
        <defs><linearGradient id="vSpark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".22" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient></defs>
        <path d="M0 50 C30 46 40 52 62 40 S98 44 120 32 S160 38 184 24 S228 28 250 16 S282 14 300 6 L300 64 L0 64Z" fill="url(#vSpark)" />
        <path className="v-spark-line" pathLength={1} d="M0 50 C30 46 40 52 62 40 S98 44 120 32 S160 38 184 24 S228 28 250 16 S282 14 300 6" fill="none" stroke="#fff" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="v-row"><img src="/token-icons/usdg.png" alt="" /><div><b>USDG</b><span>Global Dollar</span></div><strong>$6,420.00</strong></div>
      <div className="v-row"><span className="v-stock">TSLA</span><div><b>TSLA</b><span>Stock Token</span></div><strong>$4,240.52</strong></div>
      <div className="v-row"><img src="/token-icons/eth.png" alt="" /><div><b>ETH</b><span>Gas &amp; savings</span></div><strong>$2,180.00</strong></div>
    </div>
  );
}

export function SignVisual() {
  const [ref, step] = useLoop<HTMLDivElement>(4, 1300, 2200);
  return (
    <div className="v-sign" ref={ref} data-step={step}>
      <div className="v-bubble">Send 250 USDG to 0x9f…a1</div>
      <div className="v-review">
        <div className="v-review-head"><span>Review transfer</span><b>250.00 USDG</b></div>
        <div className="v-kv"><span>To</span><b>0x9f…a1</b></div>
        <div className="v-kv"><span>Network</span><b><img src="/chain-icons/robinhood.svg" alt="" />Robinhood</b></div>
        <div className="v-kv"><span>Network fee</span><b>paid in ETH</b></div>
        <div className="v-sign-btn">
          <span className="v-sign-label v-sign-idle">Sign with your wallet</span>
          <span className="v-sign-label v-sign-busy"><i />Signing…</span>
          <span className="v-sign-label v-sign-done">✓ Sent on Robinhood Chain</span>
        </div>
      </div>
    </div>
  );
}

export function SurfacesVisual() {
  const [ref, step] = useLoop<HTMLDivElement>(4, 1100, 1100);
  const nodes = ['App', 'CLI', 'API', 'Skill'];
  return (
    <div className="v-surf" ref={ref}>
      <svg className="v-surf-lines" viewBox="0 0 300 220" preserveAspectRatio="none">
        {[[58, 44], [242, 44], [58, 176], [242, 176]].map(([x, y], i) => (
          <path key={i} className={step === i ? 'on' : ''} d={`M${x} ${y} L150 110`} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {nodes.map((n, i) => <div key={n} className={`v-node v-node-${i} ${step === i ? 'on' : ''}`}>{n}</div>)}
      <div className="v-core">
        <div className="v-core-ring" />
        <img src="/robank-mark.png" alt="" />
      </div>
      <div className="v-lock"><i />Only your wallet signs</div>
    </div>
  );
}

const CLI_CMD = 'robank ask "send 250 USDG to 0x9f…a1"';

export function AgentDemo() {
  const [ref, step] = useLoop<HTMLDivElement>(9, 850, 3200);
  const typed = useTypewriter(CLI_CMD, step === 0, 20);
  const on = (n: number) => (step >= n ? 'on' : '');
  return (
    <div className="lp-demo" ref={ref}>
      <div className="lp-window lp-cli" data-reveal data-tilt="4">
        <div className="lp-window-inner" data-tilt-target>
          <div className="lp-window-bar"><span className="lp-dots"><i /><i /><i /></span><b>robank — zsh</b><em>CLI</em></div>
          <div className="lp-cli-body">
            <div className="c-banner"><b>ROBANK CLI</b><span>read · ask · prepare</span></div>
            <div className="c-line"><span className="c-prompt">~ $</span><span className="c-cmd">{step === 0 ? typed : CLI_CMD}</span>{step === 0 && <i className="c-caret" />}</div>
            <div className={`c-line c-dim ${on(1)}`}><span className="c-mark">›</span>reading Robinhood Chain balances</div>
            <div className={`c-line ${on(2)}`}><span className="c-ok">✓</span>balance<span className="c-val">1,240.00 USDG</span></div>
            <div className={`c-line ${on(3)}`}><span className="c-ok">✓</span>recipient<span className="c-val">valid address</span></div>
            <div className={`c-line c-dim ${on(4)}`}><span className="c-mark">›</span>preparing transfer</div>
            <div className={`c-table ${on(5)}`}>
              <div><span>amount</span><b>250 USDG</b></div>
              <div><span>network</span><b>Robinhood Chain</b></div>
              <div><span>status</span><b>prepared · not sent</b></div>
            </div>
            <div className={`c-box ${on(6)}`}><b>✓ Ready for your signature</b><span>Open ROBANK to review the fee and sign.</span></div>
            <div className={`c-line ${on(7)}`}><span className="c-prompt">~ $</span><i className="c-caret" /></div>
          </div>
        </div>
      </div>

      <div className="lp-window lp-chat" data-reveal data-tilt="4">
        <div className="lp-window-inner" data-tilt-target>
          <div className="lp-window-bar lp-chat-bar">
            <div className="a-id"><span><img src="/robank-mark.png" alt="" /></span><div><b>ROBANK AI</b><small><i />Online</small></div></div>
            <em>APP</em>
          </div>
          <div className="lp-chat-body">
            <div className={`a-msg a-user ${on(1)}`}>Send 250 USDG to 0x9f…a1.</div>
            <div className={`a-typing ${step === 2 ? 'on' : ''}`}><i /><i /><i /></div>
            <div className={`a-msg a-bot ${on(3)}`}><b>I prepared that transfer.</b>You have 1,240.00 USDG on Robinhood Chain. Review the fee and sign — I never send anything myself.</div>
            <div className={`a-tx ${on(4)}`}>
              <div className="a-tx-head"><span>Transfer</span><b>250.00 USDG</b></div>
              <div className="v-kv"><span>To</span><b>0x9f…a1</b></div>
              <div className="v-kv"><span>Network</span><b><img src="/chain-icons/robinhood.svg" alt="" />Robinhood Chain</b></div>
              <div className={`a-tx-btn ${step >= 6 ? 'done' : ''}`}>{step >= 6 ? '✓ Ready for review' : 'Review & sign →'}</div>
            </div>
          </div>
          <div className="a-input"><span>Ask ROBANK anything…</span><b>↑</b></div>
        </div>
      </div>
    </div>
  );
}

export function CardVisual({ compact }: { compact?: boolean }) {
  return (
    <div className={`lp-card-stage ${compact ? 'compact' : ''}`} data-tilt="14" data-reveal>
      <div className="lp-card-float">
        <div className="lp-card" data-tilt-target>
          <div className="lp-card-face">
            <div className="lp-card-top">
              <div className="lp-card-brand"><img src="/robank-mark.png" alt="" /><b>ROBANK</b></div>
              <svg className="lp-card-nfc" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M8.5 7.5a6.5 6.5 0 0 1 0 9" /><path d="M12 5a10 10 0 0 1 0 14" /><path d="M15.5 2.8a13 13 0 0 1 0 18.4" /></svg>
            </div>
            <div className="lp-card-chip"><i /><i /><i /><i /></div>
            <div className="lp-card-num"><span>••••</span><span>••••</span><span>••••</span><span>4821</span></div>
            <div className="lp-card-bottom">
              <div><small>Card</small><b>Virtual · USD</b></div>
              <div className="lp-visa">VISA</div>
            </div>
          </div>
          <div className="lp-card-sheen" />
          <div className="lp-card-edge" />
        </div>
      </div>
      <div className="lp-card-shadow" />
      {!compact && <>
        <div className="lp-chip-float lp-chip-a"><small>Loaded from</small><b><img src="/robank-mark.png" alt="" />ROBANK balance</b></div>
        <div className="lp-chip-float lp-chip-b"><small>Accepted</small><b>Wherever Visa works online</b></div>
      </>}
    </div>
  );
}

export function BankVisual() {
  return (
    <div className="lp-bank-stage" data-reveal data-tilt="8">
      <div className="lp-bank" data-tilt-target>
        <div className="lp-bank-head">
          <div className="lp-card-brand"><img src="/robank-mark.png" alt="" /><b>ROBANK</b></div>
        </div>
        <small className="lp-bank-label">Cash out</small>
        <div className="lp-bank-kv">
          <div><span>You cash out</span><b>$250.00</b></div>
          <div><span>Paid to</span><b>you@paypal.com</b></div>
          <div><span>You receive</span><b>€215.60</b></div>
        </div>
        <div className="lp-bank-flow">
          <div><img src="/chain-icons/robinhood.svg" alt="" /><span>Robinhood Chain</span></div>
          <div className="lp-bank-wire"><i /><i /></div>
          <div><i className="lp-bank-ico">P</i><span>PayPal</span></div>
        </div>
      </div>
    </div>
  );
}
