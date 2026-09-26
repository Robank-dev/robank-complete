import { HttpError, fetchJson, handle, ok } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

const safeUrl = (value: unknown) => {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
};
const clip = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export const GET = handle(async (request: Request) => {
  const incoming = new URL(request.url).searchParams;
  const url = new URL('https://x402-list.com/api/v1/services');
  url.searchParams.set('status', 'online');
  url.searchParams.set('per_page', String(Math.min(Math.max(Number(incoming.get('limit')) || 30, 1), 50)));
  const q = clip(incoming.get('q'), 80);
  if (q) url.searchParams.set('q', q);
  const category = clip(incoming.get('category'), 30);
  if (category && category !== 'All') url.searchParams.set('category', category);

  const [directory, bountyFeed] = await Promise.allSettled([
    fetchJson<any>(url.toString(), { provider: 'x402 directory', timeoutMs: 8000 }),
    fetchJson<any>('https://api.agentbounties.app/v1/base/autonomous-bounties/feed?network=base-mainnet&claimable_only=true', { provider: 'Agent Bounties', timeoutMs: 6000 })
  ]);
  if (directory.status === 'rejected') throw directory.reason instanceof HttpError ? directory.reason : new HttpError(502, 'The x402 directory is unavailable right now.');

  const services = (Array.isArray(directory.value?.data) ? directory.value.data : [])
    .filter((item: any) => (item?.networks_caip2 || []).some((n: string) => n === 'eip155:8453' || n === 'eip155:4663'))
    .map((item: any) => ({
      slug: clip(item.slug, 80),
      name: clip(item.name, 80) || 'Unnamed service',
      description: clip(item.description, 400),
      websiteUrl: safeUrl(item.website_url || item.base_url),
      category: clip(item.category, 30) || 'Other',
      verified: Boolean(item.verified),
      riskLevel: clip(item.assessment?.risk_level || 'unknown', 20).toLowerCase(),
      minPriceUsd: Number.isFinite(Number(item.min_price_usd)) ? Number(item.min_price_usd) : null,
      networks: (item.networks_caip2 || []).map((n: string) => (n === 'eip155:8453' ? 'Base' : n === 'eip155:4663' ? 'Robinhood Chain' : null)).filter(Boolean),
      endpointCount: Number(item.endpoint_count) || 0,
      uptime24h: item.uptime_24h != null && Number.isFinite(Number(item.uptime_24h)) ? Number(item.uptime_24h) : null
    }))
    .filter((s: any) => s.slug);

  const feed = bountyFeed.status === 'fulfilled' ? bountyFeed.value : null;
  const items = Array.isArray(feed) ? feed : Array.isArray(feed?.bounties) ? feed.bounties : Array.isArray(feed?.data) ? feed.data : [];
  const externalBounties = items.map((item: any) => ({
    id: clip(item.id || item.bounty_id || item.bountyId, 80),
    title: clip(item.title || item.name, 140),
    description: clip(item.description || item.acceptance_criteria, 400),
    rewardUsdc: Number.isFinite(Number(item.reward_amount_usdc ?? item.rewardAmountUsdc ?? item.reward_amount)) ? Number(item.reward_amount_usdc ?? item.rewardAmountUsdc ?? item.reward_amount) : null,
    url: safeUrl(item.url || item.bounty_url) || 'https://agentbounties.app/'
  })).filter((b: any) => b.id && b.title).slice(0, 30);

  return ok({ generatedAt: new Date().toISOString(), services, externalBounties, bountiesAvailable: bountyFeed.status === 'fulfilled' }, { headers: { 'Cache-Control': 'public, max-age=60' } });
});
