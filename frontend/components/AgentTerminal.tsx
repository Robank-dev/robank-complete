'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api, type AgentAction } from '@/lib/api';
import { friendlyError } from '@/lib/errors';
import { Spinner } from './ui';

type Message = { id: number; role: 'user' | 'assistant' | 'error'; content: string; action?: AgentAction };

const SUGGESTIONS = ['What is my balance?', 'Send 10 USDC to 0x… on Base', 'What is an xStock?', 'How do I borrow against my assets?'];

let nextId = 1;

export default function AgentTerminal() {
  const [messages, setMessages] = useState<Message[]>([{ id: 0, role: 'assistant', content: 'Hi — I can read your balances, explain ROBANK, and **prepare** transfers for you to review. I never send, sign or pay anything on my own.' }]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, busy]);

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
        {messages.map((m) => (
          <div key={m.id} className={`agent-msg ${m.role}`}>
            {m.role === 'user' ? <p>{m.content}</p> : m.role === 'error' ? <p className="ui-hint bad">{m.content}</p> : (
              <div className="ui-md">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer noopener">{children}</a>, img: () => null }}>{m.content}</ReactMarkdown>
              </div>
            )}
            {m.action && m.action.type !== 'none' && (
              <div className="agent-action">
                {m.action.type === 'prepare-transfer' && <span className="ui-badge pending">Prepared · not sent</span>}
                <Link className={`ui-btn ${m.action.type === 'prepare-transfer' ? 'primary' : 'secondary'} sm`} href={m.action.path as any}>{m.action.label} →</Link>
              </div>
            )}
          </div>
        ))}
        {busy && <div className="agent-msg assistant"><span className="ui-muted" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Spinner /> Thinking…</span></div>}
        <div ref={endRef} />
      </div>
      {messages.length <= 1 && (
        <div className="agent-suggestions">{SUGGESTIONS.map((s) => <button type="button" key={s} className="ui-chip" onClick={() => setInput(s)}>{s}</button>)}</div>
      )}
      <form className="agent-input" onSubmit={(e) => { e.preventDefault(); void send(input); }}>
        <textarea className="ui-textarea" rows={1} value={input} maxLength={2000} placeholder="Ask anything, or: send 25 USDC to 0x… on Base" aria-label="Message the agent"
          onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input); } }} />
        <button type="submit" className="ui-btn primary" disabled={busy || !input.trim()}>Send</button>
      </form>
    </section>
  );
}
