'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api, type AgentAction } from '@/lib/api';
import { friendlyError } from '@/lib/errors';
import MarketRun from './MarketRun';
import SwapCard from './SwapCard';
import TransferCard from './TransferCard';

type Message = { id: number; role: 'user' | 'assistant' | 'error'; content: string; action?: AgentAction };

const SUGGESTIONS = ['What is my balance?', 'Buy $20 of NVDA', 'Find a text-to-speech agent', 'Send 10 USDG to 0x…'];

let nextId = 1;

const Markdown = ({ text }: { text: string }) => (
  <div className="ui-md">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>,
      img: () => null,
      table: ({ children }) => <div className="agent-table"><table>{children}</table></div>
    }}>{text}</ReactMarkdown>
  </div>
);

function Actions({ action }: { action?: AgentAction }) {
  if (!action || action.type === 'none') return null;
  if (action.type === 'market') {
    return (
      <div className="agent-cards">
        {action.services.map((svc) => <MarketRun key={svc.id} service={svc} compact />)}
        <Link className="ui-btn ghost sm" href={action.path as any}>See more in Agent Market →</Link>
      </div>
    );
  }
  if (action.type === 'swap') return <div className="agent-cards single"><SwapCard side={action.side} symbol={action.symbol} amount={action.amount} quote={action.quote} /></div>;
  if (action.type === 'prepare-transfer') return <div className="agent-cards single"><TransferCard asset={action.summary.asset} amount={action.summary.amount} to={action.summary.to} /></div>;
  return <div className="agent-links"><Link className="ui-btn secondary sm" href={action.path as any}>{action.label} →</Link></div>;
}

export default function AgentTerminal() {
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: 'assistant', content: 'Hi, I’m your ROBANK agent. I can check your balance, send USDG or ETH, buy and sell Stock Tokens, and find paid AI agents to run — all on Robinhood Chain. Nothing moves until you confirm.' }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, busy]);
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    box.style.height = 'auto';
    box.style.height = `${Math.min(box.scrollHeight, 160)}px`;
  }, [input]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    if (message.length > 2000) { setMessages((m) => [...m, { id: nextId++, role: 'error', content: 'Messages are limited to 2,000 characters.' }]); return; }
    const history = messages.filter((m) => m.role !== 'error' && m.id !== 0).slice(-8).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    setMessages((m) => [...m, { id: nextId++, role: 'user', content: message }]);
    setInput('');
    setBusy(true);
    try {
      const reply = await api.agent({ message, history });
      setMessages((m) => [...m, { id: nextId++, role: 'assistant', content: reply.response, action: reply.action }]);
    } catch (error) {
      setMessages((m) => [...m, { id: nextId++, role: 'error', content: friendlyError(error, 'The agent could not respond. Please try again.') }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ui-panel agent-chat">
      <div className="agent-log" aria-live="polite">
        {messages.map((m) => m.role === 'user' ? (
          <div key={m.id} className="agent-row me"><div className="agent-bubble me">{m.content}</div></div>
        ) : (
          <div key={m.id} className={`agent-row bot${m.action && m.action.type !== 'none' && m.action.type !== 'navigate' ? ' wide' : ''}`}>
            <span className="agent-avatar"><img src="/robank-mark.png" alt="" /></span>
            <div className="agent-body">
              <span className="agent-name">ROBANK Agent</span>
              {m.role === 'error' ? <div className="agent-bubble error">{m.content}</div> : <div className="agent-bubble"><Markdown text={m.content} /></div>}
              <Actions action={m.action} />
            </div>
          </div>
        ))}
        {busy && (
          <div className="agent-row bot">
            <span className="agent-avatar"><img src="/robank-mark.png" alt="" /></span>
            <div className="agent-body"><span className="agent-name">ROBANK Agent</span><div className="agent-bubble agent-typing" aria-label="Thinking"><i /><i /><i /></div></div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      {messages.length <= 1 && (
        <div className="agent-suggestions">{SUGGESTIONS.map((s) => <button type="button" key={s} className="ui-chip" onClick={() => { setInput(s); boxRef.current?.focus(); }}>{s}</button>)}</div>
      )}
      <form className="agent-compose" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
        <textarea ref={boxRef} rows={1} value={input} maxLength={2000} placeholder="Ask something" aria-label="Message the agent"
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input); } }} />
        <button type="submit" className="agent-send" disabled={busy || !input.trim()} aria-label="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></svg>
        </button>
      </form>
    </section>
  );
}
