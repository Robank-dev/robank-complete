'use client';

import { useEffect, useState } from 'react';
import CardFace from './CardFace';

const SCENES = [
  { key: 'send', kicker: 'Send', title: 'Money moves in seconds.', detail: 'USDG and ETH on Robinhood Chain — you confirm every transfer.' },
  { key: 'stocks', kicker: 'Stock Tokens', title: 'Own the market, onchain.', detail: 'Buy NVDA, TSLA, AAPL and more with USDG.' },
  { key: 'card', kicker: 'ROBANK Card', title: 'Spend it anywhere.', detail: 'A virtual Visa card loaded from your balance.' },
  { key: 'agent', kicker: 'AI Agent', title: 'Ask. Review. Confirm.', detail: 'The agent prepares it. Only you can send it.' }
] as const;

const DURATION = 5600;
const step = (d: number) => ({ '--d': `${d}s` }) as React.CSSProperties;

/** Same markup and classes as the real confirmation sheet (components/TxConfirm). */
function SendScene() {
  return (
    <div className="reel-ui reel-sheet">
      <div className="reel-step" style={step(0.1)}><span className="ui-kicker">Confirm</span><h3>Send USDG</h3></div>
      <div className="ui-kv reel-step" style={step(0.35)}>
        <div><span>You send</span><b>250.00 USDG</b></div>
        <div><span>To</span><b className="ui-mono">0x9f00…00a1</b></div>
        <div><span>Network fee</span><b>≈ 0.000012 ETH (&lt; $0.01)</b></div>
      </div>
      <div className="reel-actions reel-step" style={step(0.6)}><span className="ui-btn ghost sm">Cancel</span><span className="ui-btn primary sm reel-press" style={step(1.8)}>Send</span></div>
      <div className="reel-done" style={step(2.4)}><span className="reel-tick">✓</span><b>Transfer confirmed</b><span>Robinhood Chain</span></div>
    </div>
  );
}

/** Same rows as Holdings on the Overview. */
function StocksScene() {
  const rows = [
    { s: 'NVDA', n: 'NVIDIA Stock Token', v: '$1,284.20', q: '6.84 NVDA', up: '+2.4%' },
    { s: 'TSLA', n: 'Tesla Stock Token', v: '$427.63', q: '1.25 TSLA', up: '+1.8%' },
    { s: 'USDG', n: 'Robinhood Chain · Stablecoin', v: '$1,840.25', q: '1,840.25 USDG', img: '/token-icons/usdg.png' }
  ];
  return (
    <div className="reel-ui reel-panel">
      <div className="reel-step" style={step(0.1)}><span className="ui-kicker">Assets</span><h3>Your holdings</h3></div>
      <div className="ui-rows">
        {rows.map((r, i) => (
          <div className="ui-row reel-step" key={r.s} style={step(0.35 + i * 0.25)}>
            <span className="reel-token">{r.img ? <img src={r.img} alt="" /> : r.s.slice(0, 1)}</span>
            <div className="ui-row-main"><b>{r.s}</b><span>{r.n}</span></div>
            <div className="ui-row-end"><b>{r.v}</b><span>{r.up ? <em className="reel-up">{r.up}</em> : r.q}</span></div>
          </div>
        ))}
      </div>
      <div className="reel-toast reel-step" style={step(2.3)}><b>Bought NVDA</b><span>+0.27 NVDA · $50.00</span></div>
    </div>
  );
}

function CardScene() {
  return (
    <div className="reel-ui reel-cardscene">
      <div className="reel-cardface"><CardFace number="555543******4821" name="YOUR NAME" balance={212.4} /></div>
      <div className="reel-toast reel-step" style={step(1.8)}><b>OpenAI</b><span>− $20.00 · Card</span></div>
    </div>
  );
}

/** Same bubbles and transfer card as the AI Agent chat. */
function AgentScene() {
  return (
    <div className="reel-ui reel-chat">
      <div className="agent-row me reel-step" style={step(0.1)}><div className="agent-bubble me">send 25 USDG to 0x9f…a1</div></div>
      <div className="agent-row bot reel-step" style={step(0.9)}>
        <span className="agent-avatar"><img src="/robank-mark.png" alt="" /></span>
        <div className="agent-body"><div className="agent-bubble">Your transfer is ready. Press <b>Send</b> — nothing moves until you confirm.</div></div>
      </div>
      <div className="reel-mini reel-step" style={step(1.7)}>
        <div><b>Send 25 USDG</b><span>To 0x9f00…00a1</span></div>
        <div className="reel-actions"><span className="ui-btn primary sm reel-press" style={step(3)}>Send</span><span className="ui-btn ghost sm">Cancel</span></div>
      </div>
    </div>
  );
}

const VISUALS = { send: SendScene, stocks: StocksScene, card: CardScene, agent: AgentScene };

/** Overview hero: a looping walkthrough of the real ROBANK screens. Pure CSS — no video download. */
export default function RobankReel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => setIndex((i) => (i + 1) % SCENES.length), DURATION);
    return () => window.clearTimeout(timer);
  }, [index, paused]);

  const scene = SCENES[index];
  const Visual = VISUALS[scene.key];

  return (
    <section className={`reel${paused ? ' paused' : ''}`} aria-label="What ROBANK does" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="reel-glow" aria-hidden="true" />
      <div className="reel-copy" key={`c-${scene.key}`}>
        <span className="reel-word"><img src="/robank-mark.png" alt="" />ROBANK</span>
        <span className="reel-kicker">{scene.kicker}</span>
        <strong>{scene.title}</strong>
        <small>{scene.detail}</small>
      </div>
      <div className={`reel-stage ${scene.key}`} key={`v-${scene.key}`} aria-hidden="true"><Visual /></div>
      <div className="reel-progress">
        {SCENES.map((s, i) => (
          <button key={s.key} type="button" aria-label={`Show ${s.kicker}`} onClick={() => setIndex(i)} className={i < index ? 'done' : i === index ? 'active' : ''}>
            <i style={i === index ? { animationDuration: `${DURATION}ms` } : undefined} />
          </button>
        ))}
      </div>
    </section>
  );
}
