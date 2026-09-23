'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import AgentTerminal from '@/components/AgentTerminal';
import { api } from '@/lib/api';

export default function AgentPage() {
  const [status, setStatus] = useState<any>(null);
  useEffect(() => { api.agentStatus().then(setStatus).catch(() => null); }, []);
  const running = status?.scheduler?.status === 'running';
  const count = status?.scheduler?.scheduledJobCount ?? 0;
  const jobs = status?.scheduler?.jobs ?? [];

  return (
    <AppShell>
      <div className="ro-page-head">
        <div>
          <div className="ro-kicker">ROBANK AUTONOMY CENTER</div>
          <h1>Your agent, on duty.</h1>
          <p>Monitor capital, liquidity and approved wallet actions from one control surface.</p>
        </div>
        <div className={`ro-status-pill ${running ? 'live' : ''}`}><i /> AUTOPILOT {status ? (running ? 'ACTIVE' : 'STOPPED') : 'LOADING'}</div>
      </div>

      <section className="ro-stat-grid ro-agent-stats">
        <div className="ro-stat"><span>AGENT STATUS</span><strong>{status ? (running ? 'ACTIVE' : 'IDLE') : '—'}</strong><small>Scheduler state</small></div>
        <div className="ro-stat"><span>JOBS</span><strong>{count}</strong><small>Scheduled jobs</small></div>
        <div className="ro-stat"><span>EXECUTION</span><strong>{status?.agent?.execution?.autonomous ? 'AUTONOMOUS' : 'APPROVAL'}</strong><small>Current policy</small></div>
        <div className="ro-stat"><span>NETWORKS</span><strong>2</strong><small>Base + Robinhood Chain</small></div>
      </section>

      <section className="ro-content-grid agent-grid">
        <div className="ro-panel">
          <div className="ro-panel-head"><div><span className="ro-kicker">AGENT JOBS</span><h3>What ROBANK is monitoring.</h3></div><span className="ro-panel-note">{running ? 'RUNNING' : 'IDLE'}</span></div>
          <div className="ro-list">{jobs.length ? jobs.map((job: any) => <div className="ro-list-row" key={job.id || job.name}><div><b>{job.name || 'Scheduled job'}</b><span>{job.description || 'Agent monitoring task'}</span></div><em>{job.scheduled ? 'SCHEDULED' : 'STOPPED'}</em></div>) : <div className="ro-empty"><strong>No jobs configured.</strong><span>Create or configure an agent job before expecting autonomous activity.</span></div>}</div>
        </div>
        <div className="ro-panel">
          <div className="ro-panel-head"><div><span className="ro-kicker">RECENT DECISIONS</span><h3>What the agent checked.</h3></div></div>
          <div className="ro-empty"><strong>No decisions yet.</strong><span>Agent checks will appear here when the backend records them.</span></div>
        </div>
      </section>

      <section className="ro-terminal-section"><div className="ro-kicker">AGENT TERMINAL</div><h3>Talk to ROBANK.</h3><AgentTerminal /></section>
      <div className="ro-notice"><span>POLICY</span> Autonomous execution remains constrained by the active ROBANK mandate. Actions outside configured permissions require approval.</div>
    </AppShell>
  );
}
