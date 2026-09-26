import { capabilities } from '@/lib/server/capabilities';
import { handle, ok } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

export const GET = handle(async () => ok({ generatedAt: new Date().toISOString(), capabilities: capabilities() }, { headers: { 'Cache-Control': 'public, max-age=60' } }));
