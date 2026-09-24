'use client';

import AppShell from '@/components/AppShell';

export default function LoanPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <div className="text-xs uppercase tracking-[.2em] text-white/40">ROBANK / LOAN</div>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Loan.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
            A future capital rail for accessing liquidity through supported
            providers, eligibility rules and jurisdiction-aware workflows.
          </p>
        </div>

        <section className="relative overflow-hidden rounded-3xl border border-ro-line bg-ro-panel p-8 md:p-10">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/[.04] blur-3xl" />
          <div className="relative">
            <div className="inline-flex rounded-full border border-white/10 px-3 py-1.5 text-[9px] font-mono uppercase tracking-[.15em] text-white/45">
              COMING SOON
            </div>
            <h2 className="mt-5 text-2xl font-medium">Liquidity, when you need it.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/40">
              Loan functionality is being prepared as a separate provider-backed
              surface. Terms, eligibility, collateral, pricing, approvals and
              execution will be shown only when the relevant rail is connected.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ['01', 'Eligibility', 'Country, account and provider checks'],
                ['02', 'Terms', 'Rate, limit, collateral and fees'],
                ['03', 'Execution', 'Explicit review before any provider action'],
              ].map(([n, title, description]) => (
                <div key={n} className="rounded-2xl border border-white/8 bg-black/15 p-4">
                  <div className="text-[9px] font-mono text-white/25">{n}</div>
                  <div className="mt-3 text-sm font-medium">{title}</div>
                  <div className="mt-2 text-xs leading-5 text-white/35">{description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-white/10 bg-white/[.02] p-4 text-xs leading-5 text-white/30">
          Loan is not currently enabled in the ROBANK production web runtime.
        </div>
      </div>
    </AppShell>
  );
}
