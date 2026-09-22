'use client';

export default function TransactionList({ transactions = [] }: { transactions?: Array<{ hash: string; description?: string; value?: string }> }) {
  if (!transactions.length) {
    return (
      <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
        <div className="text-sm text-white/50">Recent activity</div>
        <div className="mt-8 text-center text-sm text-white/35">No transactions yet.</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ro-line bg-ro-panel p-5">
      <div className="text-sm text-white/50">Recent activity</div>
      <div className="mt-4 space-y-2">
        {transactions.map((tx) => (
          <div key={tx.hash} className="flex items-center justify-between rounded-xl border border-white/5 px-4 py-3 text-sm">
            <div>
              <div>{tx.description || 'Transaction'}</div>
              <div className="mt-1 font-mono text-[11px] text-white/35">{tx.hash.slice(0, 10)}…</div>
            </div>
            <div className="font-mono text-white/75">{tx.value || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
