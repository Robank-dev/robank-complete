import AppShell from '@/components/AppShell';
import OnrampWidget from '@/components/OnrampWidget';

export default function OnrampPage() {
  return <AppShell><div className="mx-auto max-w-2xl"><div className="mb-6"><div className="text-xs uppercase tracking-[.2em] text-white/40">On-ramp</div><h2 className="mt-2 text-3xl font-semibold">Buy USDC</h2></div><OnrampWidget /></div></AppShell>;
}
