import { getCloudflareContext } from '@opennextjs/cloudflare';
import { ROBINHOOD_CHAIN_ID, USDG } from '@/lib/chains';
import { db } from './env';

/**
 * Agent Market catalog: paid x402 services from the Coinbase x402 Bazaar that accept USDG on
 * Robinhood Chain. The full Bazaar is scanned (it has no network filter) and the Robinhood subset
 * is cached in D1, refreshed in the background when stale.
 */

const BAZAAR = 'https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources';
const NETWORK = `eip155:${ROBINHOOD_CHAIN_ID}`;
const PAGE = 500;
const STALE_MS = 6 * 3600_000;
const CACHE_ID = 'bazaar:4663';

export type MarketField = { name: string; description: string; example: string; required: boolean };
export type MarketService = {
  id: string;
  url: string;
  name: string;
  description: string;
  tags: string[];
  icon: string | null;
  method: 'GET' | 'POST';
  fields: MarketField[];
  body: string | null;
  priceUnits: string;
  priceUsd: number;
  payTo: string;
  maxTimeoutSeconds: number;
  score: number;
};

const clip = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const httpsUrl = (v: unknown) => { try { const u = new URL(String(v)); return u.protocol === 'https:' ? u.toString() : null; } catch { return null; } };
const idFor = (url: string) => url.replace(/^https:\/\//, '').replace(/[^a-zA-Z0-9]+/g, '-').slice(0, 120);

function toService(item: any): MarketService | null {
  const accept = (item?.accepts || []).find((a: any) => a?.network === NETWORK && a?.scheme === 'exact' && String(a?.asset || '').toLowerCase() === USDG.address.toLowerCase());
  const url = httpsUrl(item?.resource);
  if (!accept || !url || !/^\d{1,12}$/.test(String(accept.amount)) || !/^0x[a-fA-F0-9]{40}$/.test(String(accept.payTo))) return null;
  const input = item?.extensions?.bazaar?.info?.input || {};
  const schema = item?.extensions?.bazaar?.schema?.properties?.input?.properties || {};
  const method = String(input.method || 'GET').toUpperCase() === 'POST' ? 'POST' : 'GET';
  const qpSchema = schema?.queryParams?.properties || {};
  const qpRequired: string[] = schema?.queryParams?.required || [];
  const examples = input.queryParams && typeof input.queryParams === 'object' ? input.queryParams : {};
  const names = [...new Set([...Object.keys(qpSchema), ...Object.keys(examples)])].slice(0, 12);
  const fields = method === 'GET' ? names.map((name) => ({
    name: clip(name, 40),
    description: clip(qpSchema[name]?.description, 160),
    example: examples[name] != null ? clip(typeof examples[name] === 'object' ? JSON.stringify(examples[name]) : examples[name], 200) : '',
    required: qpRequired.includes(name)
  })) : [];
  const body = method === 'POST' && input.body != null ? clip(JSON.stringify(input.body, null, 2), 4000) : null;
  const units = String(accept.amount);
  return {
    id: idFor(url),
    url,
    name: clip(item.serviceName || new URL(url).hostname, 80),
    description: clip(item.description, 500),
    tags: (Array.isArray(item.tags) ? item.tags : []).map((t: unknown) => clip(t, 24)).filter(Boolean).slice(0, 8),
    icon: httpsUrl(item.iconUrl),
    method,
    fields,
    body,
    priceUnits: units,
    priceUsd: Number(units) / 10 ** USDG.decimals,
    payTo: String(accept.payTo),
    maxTimeoutSeconds: Math.min(Number(accept.maxTimeoutSeconds) || 300, 600),
    score: Number(item?.quality?.score ?? item?.quality?.overall ?? 0) || 0
  };
}

async function fetchPage(offset: number) {
  const response = await fetch(`${BAZAAR}?limit=${PAGE}&offset=${offset}`, { headers: { Accept: 'application/json', 'User-Agent': 'ROBANK/1.0' } });
  if (!response.ok) throw new Error(`Bazaar ${response.status}`);
  return response.json() as Promise<{ items?: any[]; pagination?: { total?: number } }>;
}

async function scan(): Promise<MarketService[]> {
  const first = await fetchPage(0);
  const total = Math.min(Number(first.pagination?.total) || 0, 60_000);
  const offsets: number[] = [];
  for (let o = PAGE; o < total; o += PAGE) offsets.push(o);
  const pages = [first];
  for (let i = 0; i < offsets.length; i += 6) {
    const batch = await Promise.all(offsets.slice(i, i + 6).map((o) => fetchPage(o).catch(() => ({ items: [] }))));
    pages.push(...batch);
  }
  const byUrl = new Map<string, MarketService>();
  for (const page of pages) for (const item of page.items || []) {
    const service = toService(item);
    if (service && !byUrl.has(service.url)) byUrl.set(service.url, service);
  }
  return [...byUrl.values()];
}

let memory: { at: number; services: MarketService[] } | null = null;
let refreshing: Promise<MarketService[]> | null = null;

async function refresh() {
  refreshing ??= scan().then(async (services) => {
    if (services.length) {
      memory = { at: Date.now(), services };
      await db()?.prepare('INSERT INTO market_cache (id, body, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(id) DO UPDATE SET body = ?2, updated_at = ?3')
        .bind(CACHE_ID, JSON.stringify(services), new Date().toISOString()).run().catch(() => undefined);
    }
    return services;
  }).finally(() => { refreshing = null; });
  return refreshing;
}

/** All Robinhood Chain services, from memory, then D1, then a live scan. Stale data is served while it refreshes. */
export async function marketServices(): Promise<MarketService[]> {
  if (!memory) {
    const row = await db()?.prepare('SELECT body, updated_at FROM market_cache WHERE id = ?1').bind(CACHE_ID).first<{ body: string; updated_at: string }>().catch(() => null);
    if (row?.body) memory = { at: new Date(row.updated_at).getTime(), services: JSON.parse(row.body) };
  }
  if (!memory) return refresh();
  if (Date.now() - memory.at > STALE_MS) {
    const pending = refresh().catch(() => memory?.services || []);
    try { getCloudflareContext().ctx.waitUntil(pending); } catch {}
  }
  return memory.services;
}

const STOP = new Set(['a', 'an', 'the', 'for', 'to', 'of', 'me', 'my', 'i', 'buy', 'find', 'need', 'want', 'use', 'run', 'call', 'get', 'agent', 'agents', 'service', 'services', 'api', 'tool', 'tools', 'please', 'some', 'with', 'on', 'and', 'x402']);

/** Keyword search over name, tags, description and URL. */
export async function searchMarket(query: string, limit = 12): Promise<MarketService[]> {
  const services = await marketServices();
  const words = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w));
  if (!words.length) return [...services].sort((a, b) => b.score - a.score || a.priceUsd - b.priceUsd).slice(0, limit);
  const scored = services.map((s) => {
    const name = s.name.toLowerCase(), tags = s.tags.join(' ').toLowerCase(), desc = s.description.toLowerCase(), url = s.url.toLowerCase();
    let score = 0;
    for (const w of words) {
      if (name.includes(w)) score += 6;
      if (tags.includes(w)) score += 4;
      if (url.includes(w)) score += 3;
      if (desc.includes(w)) score += 2;
    }
    return { s, score };
  }).filter((x) => x.score > 0);
  return scored.sort((a, b) => b.score - a.score || b.s.score - a.s.score || a.s.priceUsd - b.s.priceUsd).slice(0, limit).map((x) => x.s);
}

export async function marketService(id: string) {
  return (await marketServices()).find((s) => s.id === id) || null;
}
