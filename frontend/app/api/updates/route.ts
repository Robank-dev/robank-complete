import { isOwner, requireSession } from '@/lib/server/auth';
import { HttpError, handle, httpsUrl, ok, readJson, text } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { newId, now, requireDb, toUpdate } from '@/lib/server/records';

export const dynamic = 'force-dynamic';

export const GET = handle(async (request: Request) => {
  const database = requireDb();
  const { results } = await database.prepare('SELECT * FROM updates ORDER BY published_at DESC LIMIT 50').all();
  let canPublish = false;
  if (request.headers.get('authorization')) {
    try { canPublish = isOwner(await requireSession(request)); } catch {}
  }
  return ok({ updates: results.map(toUpdate), canPublish });
});

export const POST = handle(async (request: Request) => {
  const session = await requireSession(request);
  if (!isOwner(session)) throw new HttpError(403, 'Only the ROBANK team can publish updates.');
  await rateLimit(`updates:${session.userId}`, 20, 3600);
  const body = await readJson(request);
  const update = {
    id: newId(),
    title: text(body.title, { max: 140, name: 'Title' }) || null,
    body: text(body.body, { max: 4000, required: true, name: 'Update text' }),
    xUrl: httpsUrl(body.xUrl, 'Post link') || null,
    imageUrl: httpsUrl(body.imageUrl, 'Image link') || null,
    publishedAt: now()
  };
  await requireDb().prepare('INSERT INTO updates (id, author_user_id, title, body, x_url, image_url, published_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)')
    .bind(update.id, session.userId, update.title, update.body, update.xUrl, update.imageUrl, update.publishedAt).run();
  return ok({ update }, { status: 201 });
});
