'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { Alert, Badge, Empty, Skeleton, Spinner } from '@/components/ui';
import { api, type Job } from '@/lib/api';
import { STABLECOINS, chainById, explorerTx, parseAmount } from '@/lib/chains';
import { friendlyError } from '@/lib/errors';
import { relativeTime, short } from '@/lib/format';

const STATUS: Record<string, { tone: 'ok' | 'pending' | 'bad' | 'off' | 'live'; label: string }> = {
  open: { tone: 'live', label: 'Open' }, claimed: { tone: 'pending', label: 'In progress' }, submitted: { tone: 'pending', label: 'Submitted' },
  approved: { tone: 'ok', label: 'Approved' }, paid: { tone: 'ok', label: 'Paid' }, cancelled: { tone: 'off', label: 'Cancelled' }
};
const REWARD_CHAINS = [...new Set(STABLECOINS.filter((t) => chainById(t.chainId)?.type === 'evm').map((t) => t.chainId))];

function JobCard({ job, onChange }: { job: Job; onChange: (job: Job) => void }) {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [submission, setSubmission] = useState('');
  const [txHash, setTxHash] = useState('');
  const status = STATUS[job.status] || { tone: 'off' as const, label: job.status };

  async function act(action: Parameters<typeof api.jobAction>[1]['action'], extra: { submission?: string; txHash?: string } = {}) {
    if (busy) return;
    if (action === 'cancel' && !window.confirm('Cancel this job? This cannot be undone.')) return;
    setBusy(action);
    setError('');
    try {
      const { job: next } = await api.jobAction(job.id, { action, ...extra });
      onChange(next);
      setSubmission('');
      setTxHash('');
    } catch (e) {
      setError(friendlyError(e, 'That action could not be completed.'));
    } finally {
      setBusy('');
    }
  }

  const reward = job.rewardAmount ? `${job.rewardAmount} ${job.rewardAsset} on ${chainById(job.rewardChainId)?.label}` : null;
  const payLink = job.workerWallet && job.rewardAmount ? `/send?asset=${job.rewardAsset}&chain=${job.rewardChainId}&to=${job.workerWallet}&amount=${job.rewardAmount}` : '';

  return (
    <article className="ui-panel">
      <div className="ui-panel-head">
        <div style={{ minWidth: 0 }}><h3>{job.title}</h3><p className="ui-muted">Posted {relativeTime(job.createdAt)} by <span className="ui-mono">{short(job.creatorWallet)}</span>{job.role ? ` · you are the ${job.role}` : ''}</p></div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      <p className="ui-text" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{job.description}</p>
      <div className="ui-kv" style={{ marginTop: 12 }}>
        <div><span>Reward</span><b>{reward || 'None specified'}</b></div>
        {reward && <div><span>Payment</span><b>Paid by the poster after approval — not held in escrow</b></div>}
        {job.dueAt && <div><span>Due</span><b>{new Date(job.dueAt).toLocaleDateString()}</b></div>}
        {job.workerWallet && <div><span>Worker</span><b className="ui-mono">{short(job.workerWallet)}</b></div>}
        {job.payoutTxHash && job.rewardChainId && <div><span>Payout</span><b><a className="ui-link" href={explorerTx(job.rewardChainId, job.payoutTxHash)} target="_blank" rel="noreferrer">Verified on-chain ↗</a></b></div>}
      </div>
      {job.submission && <div style={{ marginTop: 12 }}><span className="ui-label">Submission</span><p className="ui-text" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', marginTop: 6 }}>{job.submission}</p></div>}

      <div className="ui-grid" style={{ gap: 10, marginTop: 14 }}>
        {job.status === 'open' && job.role !== 'creator' && <button type="button" className="ui-btn primary" disabled={Boolean(busy)} onClick={() => void act('claim')}>{busy === 'claim' ? <Spinner /> : 'Take this job'}</button>}
        {job.status === 'claimed' && job.role === 'worker' && (
          <>
            <textarea className="ui-textarea" value={submission} maxLength={6000} onChange={(e) => setSubmission(e.target.value)} placeholder="Describe what you delivered and link to the proof." />
            <button type="button" className="ui-btn primary" disabled={Boolean(busy) || submission.trim().length < 5} onClick={() => void act('submit', { submission })}>{busy === 'submit' ? <Spinner /> : 'Submit work'}</button>
          </>
        )}
        {job.status === 'submitted' && job.role === 'creator' && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="ui-btn primary" disabled={Boolean(busy)} onClick={() => void act('approve')}>{busy === 'approve' ? <Spinner /> : 'Approve work'}</button>
            <button type="button" className="ui-btn ghost" disabled={Boolean(busy)} onClick={() => void act('reject')}>Request changes</button>
          </div>
        )}
        {job.status === 'approved' && job.role === 'creator' && payLink && (
          <>
            <Alert tone="info">Pay the worker from your wallet, then paste the transaction hash. ROBANK checks the payment on-chain before marking the job paid.</Alert>
            <Link className="ui-btn secondary" href={payLink as any}>Pay {job.rewardAmount} {job.rewardAsset}</Link>
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="ui-input" value={txHash} onChange={(e) => setTxHash(e.target.value.trim())} placeholder="0x… transaction hash" spellCheck={false} />
              <button type="button" className="ui-btn primary" disabled={Boolean(busy) || !/^0x[a-fA-F0-9]{64}$/.test(txHash)} onClick={() => void act('record-payout', { txHash })}>{busy === 'record-payout' ? <Spinner /> : 'Verify'}</button>
            </div>
          </>
        )}
        {job.role === 'creator' && ['open', 'claimed'].includes(job.status) && <button type="button" className="ui-btn ghost sm" disabled={Boolean(busy)} onClick={() => void act('cancel')}>Cancel job</button>}
        {error && <Alert tone="bad">{error}</Alert>}
      </div>
    </article>
  );
}

function PostJob({ onCreated }: { onCreated: (job: Job) => void }) {
  const [form, setForm] = useState({ title: '', description: '', rewardAmount: '', rewardAsset: 'USDC', rewardChainId: 8453, dueAt: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const assets = STABLECOINS.filter((t) => t.chainId === form.rewardChainId).map((t) => t.symbol);
  const rewardValid = !form.rewardAmount || Boolean(parseAmount(form.rewardAmount, 6));

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const { job } = await api.createJob({ title: form.title.trim(), description: form.description.trim(), rewardAmount: form.rewardAmount || undefined, rewardAsset: form.rewardAmount ? form.rewardAsset : undefined, rewardChainId: form.rewardAmount ? form.rewardChainId : undefined, dueAt: form.dueAt ? new Date(form.dueAt + 'T23:59:00').toISOString() : undefined });
      onCreated(job);
      setForm({ ...form, title: '', description: '', rewardAmount: '', dueAt: '' });
    } catch (e) {
      setError(friendlyError(e, 'The job could not be posted.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="ui-panel" style={{ alignSelf: 'start' }}>
      <span className="ui-kicker">Post a job</span>
      <div className="ui-grid" style={{ gap: 12, marginTop: 12 }}>
        <label className="ui-field"><span className="ui-label">Title</span><input className="ui-input" maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Translate our docs to Bahasa Indonesia" /></label>
        <label className="ui-field"><span className="ui-label">Task & acceptance criteria</span><textarea className="ui-textarea" maxLength={6000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What needs to be done, and how you will judge it is done." /></label>
        <div className="ui-grid two" style={{ gap: 10 }}>
          <label className="ui-field"><span className="ui-label">Reward <em>optional</em></span><input className={`ui-input${rewardValid ? '' : ' invalid'}`} inputMode="decimal" value={form.rewardAmount} onChange={(e) => setForm({ ...form, rewardAmount: e.target.value.replace(/[^0-9.]/g, '').slice(0, 12) })} placeholder="50" /></label>
          <label className="ui-field"><span className="ui-label">Due date <em>optional</em></span><input className="ui-input" type="date" value={form.dueAt} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></label>
        </div>
        {form.rewardAmount && (
          <div className="ui-grid two" style={{ gap: 10 }}>
            <label className="ui-field"><span className="ui-label">Network</span><select className="ui-select" value={form.rewardChainId} onChange={(e) => { const id = Number(e.target.value); setForm({ ...form, rewardChainId: id, rewardAsset: STABLECOINS.find((t) => t.chainId === id)!.symbol }); }}>{REWARD_CHAINS.map((id) => <option key={id} value={id}>{chainById(id)!.label}</option>)}</select></label>
            <label className="ui-field"><span className="ui-label">Asset</span><select className="ui-select" value={form.rewardAsset} onChange={(e) => setForm({ ...form, rewardAsset: e.target.value })}>{assets.map((s) => <option key={s}>{s}</option>)}</select></label>
          </div>
        )}
        {form.rewardAmount && <p className="ui-muted">Rewards are not escrowed. You pay the worker directly after approving their work, and ROBANK verifies that payment on-chain.</p>}
        {error && <Alert tone="bad">{error}</Alert>}
        <button type="button" className="ui-btn primary" disabled={busy || form.title.trim().length < 4 || form.description.trim().length < 20 || !rewardValid} onClick={() => void submit()}>{busy ? <><Spinner /> Posting…</> : 'Post job'}</button>
      </div>
    </section>
  );
}

function Jobs() {
  const [scope, setScope] = useState<'open' | 'mine'>('open');
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    setJobs(null);
    setError('');
    api.jobs(scope).then((r) => setJobs(r.jobs)).catch((e) => setError(friendlyError(e, 'Jobs could not be loaded.')));
  }, [scope]);
  useEffect(load, [load]);
  const replace = (job: Job) => setJobs((list) => (list || []).map((j) => (j.id === job.id ? job : j)));

  return (
    <div className="ui-grid aside">
      <div className="ui-grid" style={{ alignContent: 'start' }}>
        <div className="ui-seg" role="tablist" aria-label="Jobs">
          <button type="button" role="tab" aria-selected={scope === 'open'} className={scope === 'open' ? 'active' : ''} onClick={() => setScope('open')}>Open jobs</button>
          <button type="button" role="tab" aria-selected={scope === 'mine'} className={scope === 'mine' ? 'active' : ''} onClick={() => setScope('mine')}>My jobs</button>
        </div>
        {error ? <Alert tone="bad" action={<button className="ui-btn secondary sm" onClick={load}>Retry</button>}>{error}</Alert>
          : !jobs ? <Skeleton h={160} />
            : !jobs.length ? <section className="ui-panel"><Empty title={scope === 'open' ? 'No open jobs right now' : 'You have no jobs yet'}>{scope === 'open' ? 'Post the first one — it takes a minute.' : 'Jobs you post or take appear here.'}</Empty></section>
              : jobs.map((job) => <JobCard key={job.id} job={job} onChange={replace} />)}
      </div>
      <PostJob onCreated={(job) => { setScope('mine'); setJobs((list) => [job, ...(list || [])]); }} />
    </div>
  );
}

export default function JobsPage() {
  return (
    <AppShell>
      <div className="ui-page">
        <header className="ui-head"><div><span className="ui-kicker">Jobs</span><h1>Jobs & bounties</h1><p>Post work, take work, and settle rewards in stablecoins — with the payment verified on-chain.</p></div></header>
        <Jobs />
      </div>
    </AppShell>
  );
}
