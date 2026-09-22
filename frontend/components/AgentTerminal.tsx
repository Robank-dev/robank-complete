'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function AgentTerminal() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>(['Robank AI ready. Type: what\'s my balance']);

  async function run() {
    if (!input.trim()) return;
    const message = input.trim();
    setOutput((prev) => [...prev, `> ${message}`]);
    setInput('');
    try {
      const result = await api.agent({ message });
      setOutput((prev) => [...prev, result.response]);
    } catch (error) {
      setOutput((prev) => [...prev, error instanceof Error ? error.message : 'Agent error']);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ro-line bg-black/30">
      <div className="border-b border-ro-line px-4 py-3 font-mono text-xs text-white/45">robank-agent</div>
      <div className="min-h-[360px] space-y-2 p-4 font-mono text-sm leading-6 text-white/75">
        {output.map((line, index) => <div key={index}>{line}</div>)}
      </div>
      <div className="flex border-t border-ro-line p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
          placeholder="send 50 USDC to 0x…"
          className="flex-1 bg-transparent px-2 font-mono text-sm outline-none"
        />
        <button onClick={run} className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5">Run</button>
      </div>
    </div>
  );
}
