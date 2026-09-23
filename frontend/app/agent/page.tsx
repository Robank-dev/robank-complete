'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import AgentTerminal from '@/components/AgentTerminal';
import { api } from '@/lib/api';

const jobs: any[] = [];

const decisions: any[] = [];

export default function AgentPage() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    api.agentStatus().then(setStatus).catch(() => null);
  }, []);

  const schedulerRunning = status?.scheduler?.status === 'running';
  const executionStatus = status?.agent?.execution?.autonomous ? 'AUTONOMOUS' : 'APPROVAL REQUIRED';
  const agentJobs = status?.scheduler?.jobs || jobs;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <div className="text-xs uppercase tracking-[.2em] text-white/40">
            ROBANK AUTONOMY CENTER
          </div>

          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Your agent is on duty.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                Monitor capital, liquidity, credit, assets, payments and
                reconciliation from one control surface.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-mono text-white/70">
              <span className="h-2 w-2 rounded-full bg-white/30" />
              {status ? ('AUTOPILOT ' + (schedulerRunning ? 'ACTIVE' : 'STOPPED')) : 'AUTOPILOT ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â'}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
            <div className="text-[10px] uppercase tracking-[.16em] text-white/40">
              Total Capital
            </div>
            <div className="mt-3 text-3xl font-semibold">?</div>
            <div className="mt-2 text-xs text-white/40">Unified capital view</div>
          </div>

          <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
            <div className="text-[10px] uppercase tracking-[.16em] text-white/40">
              Liquid
            </div>
            <div className="mt-3 text-3xl font-semibold">?</div>
            <div className="mt-2 text-xs text-white/40">Available liquidity</div>
          </div>

          <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
            <div className="text-[10px] uppercase tracking-[.16em] text-white/40">
              Credit
            </div>
            <div className="mt-3 text-3xl font-semibold">?</div>
            <div className="mt-2 text-xs text-white/40">Configured capacity</div>
          </div>

          <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
            <div className="text-[10px] uppercase tracking-[.16em] text-white/40">
              Agent Jobs
            </div>
            <div className="mt-3 text-3xl font-semibold">{status?.scheduler?.scheduledJobCount ?? 0}</div>
            <div className="mt-2 text-xs text-white/40">Scheduled jobs</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-[.16em] text-white/40">
                  AGENT JOBS
                </div>
                <h3 className="mt-2 text-xl font-medium">
                  What ROBANK is actually monitoring.
                </h3>
              </div>

              <span className="text-[10px] font-mono text-white/35">
                {schedulerRunning ? 'RUNNING' : 'STOPPED'}
              </span>
            </div>

            <div className="mt-5 divide-y divide-white/5">
              {agentJobs.map((job: any) => (
                <div
                  key={job.id || job[0]}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{job.name || job[0]}</div>
                    <div className="mt-1 text-xs text-white/40">{job.description || job[1]}</div>
                  </div>

                  <div className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[9px] font-mono text-white/55">
                    {job.scheduled ? 'SCHEDULED' : 'STOPPED'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
            <div className="text-[10px] uppercase tracking-[.16em] text-white/40">
              RECENT DECISIONS
            </div>
            <h3 className="mt-2 text-xl font-medium">
              What the agent checked.
            </h3>

            <div className="mt-5 space-y-4">
              {decisions.map((decision) => (
                <div
                  key={decision[0]}
                  className="border-t border-white/5 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{decision[0]}</span>
                    <span className="text-[9px] font-mono text-white/30">
                      {decision[2]}
                    </span>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-white/40">
                    {decision[1]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 text-[10px] uppercase tracking-[.16em] text-white/40">
            AGENT TERMINAL
          </div>

          <AgentTerminal />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-5 text-sm text-white/45">
          Autonomous execution remains constrained by the active ROBANK
          mandate. Actions outside configured permissions require approval.
        </div>
      </div>
    </AppShell>
  );
}
