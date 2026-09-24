import { Router } from 'express';
import { listJobs } from '../services/database.js';

const router = Router();
const X402_LIST = 'https://x402-list.com/api/v1/services';

router.get('/', async (req, res) => {
  try {
    const query = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 24, 1), 50);
    const url = new URL(X402_LIST);
    url.searchParams.set('status', 'online');
    url.searchParams.set('per_page', String(limit));
    if (query) url.searchParams.set('q', query);
    if (category) url.searchParams.set('category', category);

    const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'ROBANK-Agent-Market/1.0' } });
    if (!response.ok) throw new Error(`x402 directory returned ${response.status}`);
    const payload = await response.json();
    const services = (Array.isArray(payload?.data) ? payload.data : []).filter((item) => {
      const networks = Array.isArray(item.networks_caip2) ? item.networks_caip2 : [];
      return networks.includes('eip155:8453') || networks.includes('eip155:4663');
    }).map((item) => ({
      slug: item.slug,
      name: item.name,
      description: item.description,
      websiteUrl: item.website_url || item.base_url,
      baseUrl: item.base_url,
      category: item.category || 'Other',
      status: item.status,
      paymentReady: Boolean(item.payment_ready),
      verified: Boolean(item.verified),
      minPriceUsd: item.min_price_usd ?? null,
      networks: item.networks_caip2 || [],
      endpointCount: item.endpoint_count || 0,
      uptime24h: item.uptime_24h ?? null,
      lastCheckedAt: item.last_checked_at || null
    }));

    const jobs = await listJobs({ status: 'open', limit: 50 });
    res.json({
      generatedAt: new Date().toISOString(),
      provider: 'x402-list',
      services,
      bounties: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        prizeAmount: job.budget_amount ?? null,
        prizeAsset: job.budget_asset ?? null,
        network: job.network ?? null,
        status: job.status,
        funded: false,
        createdAt: job.created_at || job.createdAt,
        dueAt: job.due_at || job.dueAt
      }))
    });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

export default router;
