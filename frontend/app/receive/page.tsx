import AppShell from '@/components/AppShell';
import ReceiveCard from '@/components/ReceiveCard';

export default function ReceivePage() {
  return <AppShell><div className="mx-auto max-w-2xl"><div className="mb-6"><div className="text-xs uppercase tracking-[.2em] text-white/40">Payments</div><h2 className="mt-2 text-3xl font-semibold">Receive</h2></div><ReceiveCard /></div></AppShell>;
}
