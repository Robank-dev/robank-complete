import { requireSession } from '@/lib/server/auth';
import { capability } from '@/lib/server/capabilities';
import { handle, ok } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

// No card program is connected. This endpoint reports that truthfully instead of a placeholder card.
export const GET = handle(async (request: Request) => {
  await requireSession(request);
  const card = capability('card');
  return ok({ card: { state: card.state, provider: 'none', detail: card.detail } });
});
