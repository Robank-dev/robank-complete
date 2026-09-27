import { buvei, buveiConfigured } from '@/lib/server/buvei';
import { HttpError, ok } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

// Connectivity check for the card provider: reports only whether a signed call succeeds, never balances or keys.
export async function GET() {
  if (!buveiConfigured()) return ok({ ok: false, reason: 'not-configured' });
  try {
    await buvei('GET', '/card-bins');
    const payouts = await buvei('POST', '/payouts/rate', { targetCurrency: 'USD' }).then(() => true, () => false);
    return ok({ ok: true, payouts });
  } catch (error) {
    return ok({ ok: false, status: error instanceof HttpError ? error.status : 500 });
  }
}
