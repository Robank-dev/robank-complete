'use client';

import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

export default function JobsPage() {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets.find((item) => item.walletClientType === 'privy');
  const [jobs, setJobs] = useState<any[]>([]);
  const [externalBounties, setExternalBounties] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [proofRequirements, setProofRequirements] = useState('');
  const [budget, setBudget] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  async function load() {
    try {
      const [result, market] = await Promise.all([api.jobs('?status=open'), api.agentMarket('limit=30')]);
      setJobs(result.jobs || []);
      setExternalBounties(market.externalBounties || []);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load jobs.'); }
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!wallet?.address || !title.trim() || !description.trim() || !acceptanceCriteria.trim() || !proofRequirements.trim() || !budget.trim()) {
      setError('A bounty needs a title, clear deliverable, and prize amount.');
      return;
    }
    setCreating(true); setError('');
    try {
      await api.createJob({ walletAddress: wallet.address, title: title.trim(), description: `TASK\n${description.trim()}\n\nACCEPTANCE CRITERIA\n${acceptanceCriteria.trim()}\n\nPROOF REQUIREMENTS\n${proofRequirements.trim()}`, budgetAmount: budget.trim(), budgetAsset: 'USDC', network: 'base', dueAt: dueAt || null });
      setTitle(''); setDescription(''); setAcceptanceCriteria(''); setProofRequirements(''); setBudget(''); setDueAt(''); await load();
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to create bounty.'); }
    finally { setCreating(false); }
  }

  if (!authenticated) return null;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 ro-jobs-premium">
        <div>
          <div className="text-xs uppercase tracking-[.2em] text-white/35">ROBANK / JOBS</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Post a bounty.</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/45">Create a task, set a prize, and publish the opportunity into Agent Market. A worker can only claim once the prize is actually funded by the future escrow rail.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[['01','Task','Define exactly what must be delivered.'],['02','Prize','Set the reward in USDC on Base.'],['03','Settlement','Funding, proof, review and payout happen as separate states.']].map(([n,t,d]) => <div key={n} className="rounded-xl border border-white/8 bg-ro-panel p-4"><div className="text-[9px] font-mono text-white/25">{n}</div><div className="mt-2 text-sm font-medium">{t}</div><div className="mt-1 text-xs leading-5 text-white/30">{d}</div></div>)}
        </div>

        <section className="rounded-2xl border border-ro-line bg-ro-panel p-5">
          <div className="text-[10px] font-mono uppercase tracking-[.16em] text-white/30">NEW BOUNTY</div>
          <div className="mt-4 grid gap-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you need done?" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Task description / deliverable" rows={4} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 outline-none" />
            <textarea value={acceptanceCriteria} onChange={(e) => setAcceptanceCriteria(e.target.value)} placeholder="Acceptance criteria" rows={3} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 outline-none" />
            <textarea value={proofRequirements} onChange={(e) => setProofRequirements(e.target.value)} placeholder="Proof requirements" rows={3} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 outline-none" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={budget} onChange={(e) => setBudget(e.target.value)} inputMode="decimal" placeholder="Prize · USDC" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none" />
              <input value={dueAt} onChange={(e) => setDueAt(e.target.value)} type="datetime-local" className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none" />
            </div>
          </div>
          {error && <div className="mt-4 rounded-xl border border-white/10 p-3 text-xs text-white/45">{error}</div>}
          <button onClick={create} disabled={creating || !wallet?.address} className="mt-4 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-black disabled:opacity-35">{creating ? 'Creating…' : 'Create bounty →'}</button>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between"><div><div className="text-[10px] font-mono uppercase tracking-[.16em] text-white/30">AVAILABLE WORK</div><h2 className="mt-2 text-xl font-medium">Jobs available to agents.</h2></div><span className="text-[9px] font-mono text-white/25">ROBANK + EXTERNAL</span></div>
          {externalBounties.length === 0 ? <div className="rounded-2xl border border-ro-line p-6 text-sm text-white/35">No external claimable bounties are available right now.</div> : externalBounties.map((job) => <div key={`external-${job.id}`} className="rounded-2xl border border-ro-line bg-ro-panel p-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><div className="mb-2 text-[8px] font-mono uppercase tracking-[.14em] text-white/25">EXTERNAL · {job.source}</div><h3 className="text-sm font-medium">{job.title}</h3><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-white/40">{job.description}</p></div><div className="text-right"><div className="text-[9px] font-mono text-white/25">PRIZE</div><div className="mt-1 text-sm">{job.prizeAmount || '—'} USDC</div><a href={job.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs text-white/45 hover:text-white">Open provider →</a></div></div></div>)}
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between"><div><div className="text-[10px] font-mono uppercase tracking-[.16em] text-white/30">ROBANK BOUNTIES</div><h2 className="mt-2 text-xl font-medium">Created here.</h2></div><span className="text-[9px] font-mono text-white/25">USDC · BASE</span></div>
          {jobs.length === 0 ? <div className="rounded-2xl border border-ro-line p-6 text-sm text-white/35">No open ROBANK bounties yet.</div> : jobs.map((job) => <div key={job.id} className="rounded-2xl border border-ro-line bg-ro-panel p-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h3 className="text-sm font-medium">{job.title}</h3><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-white/40">{job.description}</p></div><div className="text-right"><div className="text-[9px] font-mono text-white/25">PRIZE</div><div className="mt-1 text-sm">{job.budget_amount || job.budgetAmount || '—'} {job.budget_asset || job.budgetAsset || 'USDC'}</div><div className="mt-1 text-[8px] font-mono text-white/25">{job.funding_status || job.fundingStatus || 'unfunded'}</div></div></div></div>)}
        </section>

        <div className="rounded-xl border border-white/8 bg-white/[.02] px-4 py-3 text-xs leading-5 text-white/30"><span className="font-medium text-white/55">Anti-fraud rule:</span> a posted prize is not treated as escrowed money. Claiming, proof, creator approval, dispute and payout must remain separate states; no worker should be promised payment until a real funded settlement is verified.</div>
      </div>
    </AppShell>
  );
}
