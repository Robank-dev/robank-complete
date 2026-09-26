import { requireSession } from '@/lib/server/auth';
import { createDiditSession } from '@/lib/server/didit';
import { handle, ok } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

export const POST = handle(async (request: Request) => {
  const session = await requireSession(request);
  await rateLimit(`kyc:${session.userId}`, 5, 3600);
  const { url } = await createDiditSession('DIDIT_KYC_WORKFLOW_ID', `robank-user-${session.userId}`);
  return ok({ url });
});
