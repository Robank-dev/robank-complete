import { HttpError } from './http';
import { db } from './env';

const local = new Map<string, { start: number; count: number }>();

/**
 * Fixed-window limiter. Uses D1 so limits hold across Worker isolates; falls back to
 * isolate memory when the database is unavailable (e.g. local dev without bindings).
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % windowSeconds);
  const bucket = `${key}:${windowStart}`;
  const database = db();
  let count: number;
  if (database) {
    try {
      const row = await database.prepare(
        `INSERT INTO rate_limits (bucket, window_start, count) VALUES (?1, ?2, 1)
         ON CONFLICT(bucket) DO UPDATE SET count = count + 1 RETURNING count`
      ).bind(bucket, windowStart).first<{ count: number }>();
      count = Number(row?.count || 1);
      if (Math.random() < 0.02) {
        await database.prepare('DELETE FROM rate_limits WHERE window_start < ?1').bind(now - 3600).run();
      }
    } catch {
      count = bumpLocal(bucket, windowStart);
    }
  } else {
    count = bumpLocal(bucket, windowStart);
  }
  if (count > limit) {
    throw new HttpError(429, 'Too many requests. Please wait a moment and try again.', {
      'Retry-After': String(windowStart + windowSeconds - now)
    });
  }
}

function bumpLocal(bucket: string, start: number) {
  const entry = local.get(bucket) || { start, count: 0 };
  entry.count += 1;
  local.set(bucket, entry);
  if (local.size > 5000) local.clear();
  return entry.count;
}
