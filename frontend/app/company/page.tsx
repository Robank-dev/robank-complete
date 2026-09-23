'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { api } from '@/lib/api';

export default function CompanyPage(){
  const { authenticated }=usePrivy(); const {wallets}=useWallets(); const wallet=wallets.find(w=>w.walletClientType==='privy');
  const [companies,setCompanies]=useState<any[]>([]); const [name,setName]=useState(''); const [registration,setRegistration]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  const load=async()=>{if(wallet?.address) try{setCompanies((await api.companies(wallet.address)).companies||[])}catch(e){setError(e instanceof Error?e.message:'Unable to load companies')}};
  useEffect(()=>{load()},[wallet?.address]);
  async function add(){if(!wallet?.address||!name.trim())return;setLoading(true);setError('');try{await api.createCompany({walletAddress:wallet.address,legalName:name.trim(),registrationNumber:registration.trim()||undefined,countryCode:'ID'});setName('');setRegistration('');await load()}catch(e){setError(e instanceof Error?e.message:'Unable to add company')}finally{setLoading(false)}}
  async function verify(id:string){if(!wallet?.address)return;setError('');try{const r=await api.verifyCompany(id,wallet.address);if(r.verification?.url)window.open(r.verification.url,'_blank','noopener,noreferrer');await load()}catch(e){setError(e instanceof Error?e.message:'KYB could not start')}}
  if(!authenticated)return null;
  return <AppShell><div className="space-y-6"><div><div className="text-xs uppercase tracking-[.2em] text-white/40">COMPANY</div><h1 className="mt-2 text-3xl font-semibold">Company operating profile.</h1><p className="mt-2 max-w-2xl text-sm text-white/50">Add an existing company to ROBANK. Verification is handled through KYB; ROBANK does not claim to incorporate a legal entity for you.</p></div>
    <div className="rounded-2xl border border-ro-line bg-ro-panel p-5"><div className="grid gap-3 md:grid-cols-2"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Legal company name" className="rounded-xl border border-ro-line bg-black/30 px-4 py-3 text-sm outline-none"/><input value={registration} onChange={e=>setRegistration(e.target.value)} placeholder="Registration number (optional)" className="rounded-xl border border-ro-line bg-black/30 px-4 py-3 text-sm outline-none"/></div><button onClick={add} disabled={loading||!name.trim()} className="mt-3 rounded-xl bg-white px-4 py-3 text-xs font-semibold text-black disabled:opacity-40">{loading?'Adding…':'Add company'}</button>{error&&<p className="mt-3 text-xs text-white/60">{error}</p>}</div>
    <div className="space-y-3">{companies.length===0?<div className="rounded-2xl border border-ro-line p-6 text-sm text-white/45">No companies added yet.</div>:companies.map(c=><div key={c.id} className="rounded-2xl border border-ro-line bg-ro-panel p-5"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="font-medium">{c.legal_name||c.legalName}</div><div className="mt-1 text-xs text-white/40">{c.registration_number||'Registration number not provided'} · {c.country_code||'ID'}</div></div><div className="flex items-center gap-2"><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-mono text-white/50">{c.verification_status||c.verificationStatus}</span>{(c.verification_status||c.verificationStatus)==='not_started'&&<button onClick={()=>verify(c.id)} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black">Start KYB</button>}</div></div></div>)}</div>
  </div></AppShell>
}
