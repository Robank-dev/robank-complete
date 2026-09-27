import { requireSession } from '@/lib/server/auth';
import { diditEnabled } from '@/lib/server/didit';
import { handle, ok } from '@/lib/server/http';
import { identityFor, startIdentity } from '@/lib/server/identity';
import { rateLimit } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

// Personal identity verification (ROBANK's Didit). The same check is used by the card application and Cash out.
export const GET = handle(async (request: Request) => {
  const session = await requireSession(request);
  const identity = await identityFor(session.userId);
  return ok({ enabled: diditEnabled('kyc'), status: identity.status, url: identity.url, updatedAt: null });
});

export const POST = handle(async (request: Request) => {
  const session = await requireSession(request, { allowApiKey: false });
  await rateLimit(`kyc:${session.userId}`, 5, 3600);
  const { url } = await startIdentity(session.userId, '/card');
  return ok({ enabled: true, status: 'pending', url, updatedAt: null });
});
