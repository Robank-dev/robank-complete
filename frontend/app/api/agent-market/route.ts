import { NextRequest, NextResponse } from 'next/server';

const DIRECTORY = 'https://x402-list.com/api/v1/services';

export async function GET(request: NextRequest) {
  try {
    const incoming = request.nextUrl.searchParams;
    const url = new URL(DIRECTORY);
    url.searchParams.set('status', 'online');
    url.searchParams.set('per_page', String(Math.min(Math.max(Number(incoming.get('limit')) || 30, 1), 50)));
    if (incoming.get('q')) url.searchParams.set('q', incoming.get('q')!);
    if (incoming.get('category') && incoming.get('category') !== 'All') url.searchParams.set('category', incoming.get('category')!);

    const directoryResponse = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'ROBANK-Agent-Market/1.0' }, next: { revalidate: 60 } });
    if (!directoryResponse.ok) throw new Error(`x402 directory returned ${directoryResponse.status}`);
    const payload = await directoryResponse.json();
    const services = (Array.isArray(payload?.data) ? payload.data : []).filter((item: any) => {
      const networks = Array.isArray(item.networks_caip2) ? item.networks_caip2 : [];
      return networks.includes('eip155:8453') || networks.includes('eip155:4663');
    }).map((item: any) => ({
      slug: item.slug,
      name: item.name,
      description: item.description,
      websiteUrl: item.website_url || item.base_url,
      category: item.category || 'Other',
      status: item.status,
      paymentReady: Boolean(item.payment_ready),
      verified: Boolean(item.verified),
      riskLevel: String(item.assessment?.risk_level || 'unknown').toLowerCase(),
      paymentMethods: Array.isArray(item.payment_methods)
        ? item.payment_methods.map((method: any) => String(method.protocol || method.type || '')).filter(Boolean)
        : (item.payment_ready ? ['x402'] : []),
      minPriceUsd: item.min_price_usd ?? null,
      networks: item.networks_caip2 || [],
      endpointCount: item.endpoint_count || 0,
      uptime24h: item.uptime_24h ?? null
    }));

    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    let bounties: any[] = [];
    let externalBounties: any[] = [];
    try {
      const externalUrl = 'https://api.agentbounties.app/v1/base/autonomous-bounties/feed?network=base-mainnet&claimable_only=true';
      const externalResponse = await fetch(externalUrl, { headers: { Accept: 'application/json' }, next: { revalidate: 60 } });
      if (externalResponse.ok) {
        const external = await externalResponse.json();
        const items = Array.isArray(external) ? external : Array.isArray(external?.bounties) ? external.bounties : Array.isArray(external?.data) ? external.data : [];
        externalBounties = items.map((item: any) => ({
          id: String(item.id || item.bounty_id || item.bountyId || ''),
          title: item.title || item.name || 'External bounty',
          description: item.description || item.acceptance_criteria || '',
          prizeAmount: item.reward_amount_usdc ?? item.rewardAmountUsdc ?? item.reward_amount ?? item.budget_usdc ?? null,
          prizeAsset: 'USDC',
          network: 'Base',
          status: 'open',
          funded: false,
          source: 'Agent Bounties',
          sourceUrl: item.url || item.bounty_url || 'https://agentbounties.app/',
          createdAt: item.created_at || item.createdAt || null,
          dueAt: item.deadline || item.due_at || item.dueAt || null
        })).filter((item: any) => item.id && item.title);
      }
    } catch {
      externalBounties = [];
    }
    if (apiBase) {
      const auth = request.headers.get('authorization');
      const jobsResponse = await fetch(`${apiBase.replace(/\/$/, '')}/api/jobs?status=open&limit=50`, {
        headers: auth ? { Authorization: auth } : {},
        cache: 'no-store'
      });
      if (jobsResponse.ok) {
        const jobs = await jobsResponse.json();
        bounties = (jobs.jobs || []).map((job: any) => ({
          id: job.id,
          title: job.title,
          description: job.description,
          prizeAmount: job.budget_amount ?? job.budgetAmount ?? null,
          prizeAsset: job.budget_asset ?? job.budgetAsset ?? null,
          network: job.network ?? null,
          status: job.status,
          funded: (job.funding_status ?? job.fundingStatus) === 'funded',
          createdAt: job.created_at ?? job.createdAt,
          dueAt: job.due_at ?? job.dueAt
        }));
      }
    }

    return NextResponse.json({ generatedAt: new Date().toISOString(), provider: 'x402-list', services, bounties, externalBounties });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}
