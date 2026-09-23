'use client';
import { useEffect,useState } from 'react';
import AppShell from '@/components/AppShell';
import { api } from '@/lib/api';

export default function MarketsPage(){
 const [data,setData]=useState<any>(null); const [error,setError]=useState('');
 useEffect(()=>{api.markets().then(setData).catch(e=>setError(e instanceof Error?e.message:'Market data unavailable'))},[]);
 return <AppShell><div className="space-y-6"><div><div className="text-xs uppercase tracking-[.2em] text-white/40">MARKETS</div><h1 className="mt-2 text-3xl font-semibold">Market intelligence.</h1><p className="mt-2 text-sm text-white/50">Stocks, crypto and discoverable RWA assets in one surface. Prices are provider data, not simulated values.</p></div>{error&&<div className="rounded-xl border border-ro-line p-4 text-sm text-white/55">{error}. Configure TIINGO_API_KEY on the backend for stock and crypto market data.</div>}
 <section><div className="mb-3 text-xs font-mono uppercase tracking-[.16em] text-white/35">Stocks</div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{(data?.stocks||[]).map((x:any)=><div key={x.ticker} className="rounded-2xl border border-ro-line bg-ro-panel p-4"><div className="text-sm font-medium">{x.ticker}</div><div className="mt-3 text-xl">{x.price==null?'—':`$${Number(x.price).toLocaleString(undefined,{maximumFractionDigits:2})}`}</div><div className="mt-1 text-[10px] text-white/35">{x.timestamp||'No timestamp'}</div></div>)}</div></section>
 <section><div className="mb-3 text-xs font-mono uppercase tracking-[.16em] text-white/35">Crypto</div><div className="grid gap-3 sm:grid-cols-3">{(data?.crypto||[]).map((x:any)=><div key={x.ticker} className="rounded-2xl border border-ro-line bg-ro-panel p-4"><div className="text-sm font-medium">{x.ticker?.toUpperCase()}</div><div className="mt-3 text-xl">{x.price==null?'—':`$${Number(x.price).toLocaleString(undefined,{maximumFractionDigits:6})}`}</div></div>)}</div></section>
 <section><div className="mb-3 text-xs font-mono uppercase tracking-[.16em] text-white/35">RWA / tokenized assets</div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(data?.rwa||[]).map((x:any,i:number)=><div key={`${x.symbol||x.name||'rwa'}-${i}`} className="rounded-2xl border border-ro-line bg-ro-panel p-4"><div className="text-sm font-medium">{x.symbol||x.name||'Unnamed asset'}</div><div className="mt-1 text-xs text-white/40">{x.name||x.type} · {x.network||'network unavailable'}</div></div>)}</div></section>
 </div></AppShell>
}
