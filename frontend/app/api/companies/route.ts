import { requireSession } from '@/lib/server/auth';
import { diditDecision } from '@/lib/server/didit';
import { HttpError, handle, ok, readJson, text } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { newId, now, requireDb, toCompany } from '@/lib/server/records';

export const dynamic = 'force-dynamic';

const MAX_COMPANIES = 25;
const ENTITY_TYPES = ['llc', 'corporation', 'partnership', 'sole_proprietorship', 'limited_company', 'public_company', 'nonprofit', 'foundation', 'trust', 'other'];

/** Pending verifications are refreshed from Didit so a finished KYB shows as verified without a webhook. */
async function syncPending(rows: any[]) {
  const database = requireDb();
  const pending = rows.filter((r) => r.verification_session_id && ['pending', 'in_review'].includes(r.verification_status)).slice(0, 5);
  await Promise.all(pending.map(async (row) => {
    const status = await diditDecision(row.verification_session_id);
    if (!status || status === row.verification_status || status === 'not_started') return;
    const at = now();
    const companyStatus = status === 'approved' ? 'verified' : status === 'declined' ? 'declined' : 'verification_pending';
    await database.prepare('UPDATE companies SET verification_status = ?2, status = ?3, verified_at = ?4, updated_at = ?5 WHERE id = ?1')
      .bind(row.id, status, companyStatus, status === 'approved' ? at : null, at).run();
    Object.assign(row, { verification_status: status, status: companyStatus, verified_at: status === 'approved' ? at : null });
  }));
}

export const GET = handle(async (request: Request) => {
  const session = await requireSession(request);
  const { results } = await requireDb().prepare('SELECT * FROM companies WHERE owner_user_id = ?1 ORDER BY created_at DESC LIMIT 50').bind(session.userId).all();
  await syncPending(results as any[]).catch(() => undefined);
  return ok({ companies: results.map(toCompany) });
});

export const POST = handle(async (request: Request) => {
  const session = await requireSession(request);
  await rateLimit(`companies:${session.userId}`, 20, 3600);
  const body = await readJson(request);
  const legalName = text(body.legalName, { max: 160, required: true, name: 'Legal name' });
  const registrationNumber = text(body.registrationNumber, { max: 64, name: 'Registration number' }) || null;
  const countryCode = text(body.countryCode, { max: 2, required: true, name: 'Country' }).toUpperCase();
  const jurisdictionCode = text(body.jurisdictionCode, { max: 12, name: 'Jurisdiction' }).toUpperCase() || null;
  const entityType = text(body.entityType, { max: 30, name: 'Entity type' }) || null;
  const incorporationDate = text(body.incorporationDate, { max: 10, name: 'Date of incorporation' }) || null;
  const taxId = text(body.taxId, { max: 40, name: 'Tax ID' }) || null;
  const website = text(body.website, { max: 200, name: 'Website' }) || null;
  const industry = text(body.industry, { max: 60, name: 'Industry' }) || null;
  const addressLine = text(body.addressLine, { max: 200, name: 'Registered address' }) || null;
  const city = text(body.city, { max: 80, name: 'City' }) || null;
  const postalCode = text(body.postalCode, { max: 20, name: 'Postal code' }) || null;
  const contactEmail = text(body.contactEmail, { max: 160, name: 'Contact email' }).toLowerCase() || null;
  if (legalName.length < 2) throw new HttpError(400, 'Enter the registered legal name.');
  if (!/^[A-Z]{2}$/.test(countryCode)) throw new HttpError(400, 'Choose a valid country.');
  if (jurisdictionCode && !/^[A-Z]{2}(_[A-Z0-9]{1,6})?$/.test(jurisdictionCode)) throw new HttpError(400, 'Choose a valid jurisdiction.');
  if (entityType && !ENTITY_TYPES.includes(entityType)) throw new HttpError(400, 'Choose a valid entity type.');
  if (incorporationDate && (!/^\d{4}-\d{2}-\d{2}$/.test(incorporationDate) || new Date(incorporationDate).getTime() > Date.now())) throw new HttpError(400, 'Enter a valid date of incorporation.');
  if (website && !/^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(website)) throw new HttpError(400, 'Enter a website starting with https://');
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contactEmail)) throw new HttpError(400, 'Enter a valid contact email.');
  const database = requireDb();
  const count = await database.prepare('SELECT COUNT(*) AS n FROM companies WHERE owner_user_id = ?1').bind(session.userId).first<{ n: number }>();
  if (Number(count?.n || 0) >= MAX_COMPANIES) throw new HttpError(409, `You can register up to ${MAX_COMPANIES} companies.`);
  const id = newId();
  const at = now();
  await database.prepare(`INSERT INTO companies (id, owner_user_id, legal_name, registration_number, country_code, jurisdiction_code, status, verification_status,
      entity_type, incorporation_date, tax_id, website, industry, address_line, city, postal_code, contact_email, created_at, updated_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'draft', 'not_started', ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?16)`)
    .bind(id, session.userId, legalName, registrationNumber, countryCode, jurisdictionCode, entityType, incorporationDate, taxId, website, industry, addressLine, city, postalCode, contactEmail, at).run();
  const row = await database.prepare('SELECT * FROM companies WHERE id = ?1').bind(id).first();
  return ok({ company: toCompany(row) }, { status: 201 });
});
