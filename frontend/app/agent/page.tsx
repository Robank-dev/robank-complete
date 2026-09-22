import AppShell from '@/components/AppShell';
import AgentTerminal from '@/components/AgentTerminal';

export default function AgentPage() {
  return <AppShell><div className="space-y-6"><div><div className="text-xs uppercase tracking-[.2em] text-white/40">AI Financial Agent</div><h2 className="mt-2 text-3xl font-semibold">Command your money</h2></div><AgentTerminal /><div className="rounded-2xl border border-ro-line bg-ro-panel p-5 text-sm text-white/55">The agent is intentionally confirmation-first. Transaction execution should always require explicit user confirmation before mainnet actions.</div></div></AppShell>;
}
