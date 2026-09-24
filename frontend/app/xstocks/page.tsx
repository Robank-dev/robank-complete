import Link from 'next/link';
import AppShell from '@/components/AppShell';

export default function XstocksPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <div className="text-xs uppercase tracking-[.2em] text-white/35">ROBANK / XSTOCKS</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Xstocks.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Provider-backed tokenized equity access is being prepared for ROBANK.</p>
        </div>
        <section className="rounded-2xl border border-ro-line bg-ro-panel p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[.18em] text-white/30">COMING SOON</div>
              <h2 className="mt-3 text-2xl font-medium">Tokenized markets, kept separate.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">Xstocks will stay separate from your crypto holdings and from the Agent Market. Provider eligibility, product availability and execution will be checked before any live action is exposed.</p>
            </div>
            <div className="rounded-xl border border-white/10 px-4 py-3 text-[9px] font-mono text-white/35">PROVIDER-DEPENDENT</div>
          </div>
          <div className="mt-6 rounded-xl border border-white/8 bg-white/[.02] p-4 text-xs leading-5 text-white/30"><span className="font-medium text-white/55">Important:</span> an xStock product is not the same instrument as the underlying public equity and is not issued by ROBANK.</div>
          <Link href="/assets" className="mt-5 inline-flex text-xs text-white/45 hover:text-white">Back to Assets <span className="ml-1">→</span></Link>
        </section>
      </div>
    </AppShell>
  );
}
