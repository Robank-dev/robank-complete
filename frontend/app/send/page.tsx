import AppShell from '@/components/AppShell';
import SendForm from '@/components/SendForm';

export default function SendPage() {
  return <AppShell><div className="mx-auto max-w-2xl"><div className="mb-6"><div className="text-xs uppercase tracking-[.2em] text-white/40">Payments</div><h2 className="mt-2 text-3xl font-semibold">Send USDC</h2></div><SendForm /></div></AppShell>;
}
