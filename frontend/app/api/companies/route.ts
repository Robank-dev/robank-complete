import { requireSession } from '@/lib/server/auth';
import { HttpError, handle, ok, readJson, text } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { newId, now, requireDb, toCompany } from '@/lib/server/records';

export const dynamic = 'force-dynamic';

export const GET = handle(async (request: Request) => {
  const session = await requireSession(request);
  const { results } = await requireDb().prepare('SELECT * FROM companies WHERE owner_user_id = ?1 ORDER BY created_at DESC LIMIT 50').bind(session.userId).all();
  return ok({ companies: results.map(toCompany) });
});

export const POST = handle(async (request: Request) => {
  const session = await requireSession(request);
  await rateLimit(`companies:${session.userId}`, 10, 3600);
  const body = await readJson(request);
  const legalName = text(body.legalName, { max: 160, required: true, name: 'Legal name' });
  const registrationNumber = text(body.registrationNumber, { max: 64, name: 'Registration number' }) || null;
  const countryCode = text(body.countryCode, { max: 2, required: true, name: 'Country' }).toUpperCase();
  const jurisdictionCode = text(body.jurisdictionCode, { max: 12, name: 'Jurisdiction' }).toUpperCase() || null;
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new HttpError(400, 'Choose a valid country.');
  if (jurisdictionCode && !/^[A-Z]{2}(_[A-Z0-9]{1,6})?$/.test(jurisdictionCode)) throw new HttpError(400, 'Choose a valid jurisdiction.');
  const database = requireDb();
  const count = await database.prepare('SELECT COUNT(*) AS n FROM companies WHERE owner_user_id = ?1').bind(session.userId).first<{ n: number }>();
  if (Number(count?.n || 0) >= 10) throw new HttpError(409, 'You can register up to 10 companies.');
  const id = newId();
  const at = now();
  await database.prepare(`INSERT INTO companies (id, owner_user_id, legal_name, registration_number, country_code, jurisdiction_code, status, verification_status, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'draft', 'not_started', ?7, ?7)`).bind(id, session.userId, legalName, registrationNumber, countryCode, jurisdictionCode, at).run();
  const row = await database.prepare('SELECT * FROM companies WHERE id = ?1').bind(id).first();
  return ok({ company: toCompany(row) }, { status: 201 });
});
