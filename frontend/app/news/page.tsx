'use client';
import { useEffect,useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

export default function NewsPage(){
 const [news,setNews]=useState<any[]>([]); const [error,setError]=useState('');
 useEffect(()=>{api.news('?limit=40').then(r=>setNews(r.news||[])).catch(e=>setError(e instanceof Error?e.message:'News unavailable'))},[]);
 return <AppShell><div className="space-y-6"><div><div className="text-xs uppercase tracking-[.2em] text-white/40">NEWS</div><h1 className="mt-2 text-3xl font-semibold">Financial news, filtered for ROBANK.</h1><p className="mt-2 max-w-2xl text-sm text-white/50">Crypto, stocks and RWA-relevant financial coverage. Articles remain linked to their original publisher.</p></div>{error?<div className="rounded-xl border border-ro-line p-5 text-sm text-white/50">Live news is unavailable. Connect the ROBANK news provider to enable publisher-linked coverage.</div>:<div className="grid gap-3">{news.map((n:any)=><a key={n.id} href={n.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-ro-line bg-ro-panel p-5 transition hover:bg-white/[.04]"><div className="flex flex-wrap gap-2 text-[10px] font-mono text-white/35"><span>{n.source}</span><span>{n.publishedDate?new Date(n.publishedDate).toLocaleString():''}</span>{(n.tickers||[]).slice(0,4).map((t:string)=><span key={t}>${t}</span>)}</div><h3 className="mt-2 text-base font-medium">{n.title}</h3>{n.description&&<p className="mt-2 text-sm leading-6 text-white/45">{n.description}</p>}</a>)}</div>}</div></AppShell>
}
