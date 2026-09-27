import { buvei } from './buvei';
import { diditPdf, diditSessionData } from './didit';
import { HttpError } from './http';
import { alpha2 } from './iso';

// Buvei's KYC Form: ROBANK's approved Didit verification (data, document images and PDF report) is
// submitted for card issuing, so the user verifies once and ROBANK's Didit balance pays for it.

export const OCCUPATIONS = ['PRIVATE_BUSINESS_EMPLOYEES', 'PRIVATE_BUSINESS_OWNERS_AND_EXECUTIVES', 'SOLE_TRADERS', 'FREELANCER', 'STUDENTS', 'RETIREES', 'UNEMPLOYED',
  'GOVERNMENT_OFFICERS', 'GOVERNMENT_WORKERS', 'SOE_AND_STATE_ORGAN_EXECUTIVES', 'SOE_AND_STATE_ORGAN_EMPLOYEES', 'NONE_GOVERNMENT_ORGANIZATION_EXECUTIVES', 'NONE_GOVERNMENT_ORGANIZATION_EMPLOYEES'] as const;
export const SOURCES = ['SALARY_OR_EMPLOYMENT_INCOME', 'BUSINESS_PROFITS', 'INCOME_FROM_SOLE_PROPRIETORSHIP', 'PROCEEDS_FROM_PERSONAL_INVESTMENTS', 'DIVIDENDS_OR_SHARE_DISTRIBUTIONS',
  'PENSION_OR_RETIREMENT_BENEFITS', 'FINANCIAL_SUPPORT_FROM_IMMEDIATE_FAMILY', 'LOAN_PROCEEDS', 'INHERITANCE', 'DONATION_OR_GIFT'] as const;

/** Buvei does not onboard these (nationality, address country and residence are all screened). */
export const RESTRICTED = new Set('AF AL BY BA BV BF BI CF CN CD CG HR CU ER ET GU GW HT IR IQ JO XK LB LR LY ML ME MM AN NI KP MK MP PS PR RU RS SI SO SS SD TC UA US VI VE VN YE ZW'.split(' '));

export type Profile = {
  firstName: string; lastName: string; fullName: string; fullNameEn: string; gender: 'MALE' | 'FEMALE' | '';
  birthDate: string; nationality: string; idType: 'PASSPORT' | 'ID_CARD' | 'DRIVER_LICENSE'; idNumber: string; idExpiryDate: string;
  country: string; state: string; city: string; street: string; postalCode: string; address: string;
};

export type Extras = {
  mobilePrefix: string; mobile: string; occupation: string; sourceOfFund: string; livingCountry: string;
  country: string; state: string; city: string; street: string; postalCode: string; gender?: string; idExpiryDate?: string;
};

const latin = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim();

function idOf(decision: any) {
  const list = Array.isArray(decision?.id_verifications) ? decision.id_verifications : decision?.id_verification ? [decision.id_verification] : [];
  return list.find((v: any) => String(v?.status).toLowerCase() === 'approved') || list[0] || null;
}

function selfieOf(decision: any) {
  const list = Array.isArray(decision?.liveness_checks) ? decision.liveness_checks : decision?.liveness ? [decision.liveness] : [];
  return list.find((l: any) => l?.reference_image)?.reference_image || null;
}

/** Identity data from the approved Didit session, in Buvei's format. Fields Didit could not read stay empty. */
export function profileFrom(decision: any): Profile {
  const id = idOf(decision);
  if (!id) throw new HttpError(409, 'Your verification has no identity document on file. Verify again.');
  const type = String(id.document_type || '').toLowerCase();
  const mrzName = [id.mrz?.given_names, id.mrz?.surname].filter(Boolean).join(' ');
  const fullName = String(id.full_name || [id.first_name, id.last_name].filter(Boolean).join(' ')).trim();
  const fullNameEn = latin(fullName) || latin(mrzName);
  const parsed = id.parsed_address || {};
  return {
    firstName: latin(String(id.first_name || id.mrz?.given_names || '')).slice(0, 128),
    lastName: latin(String(id.last_name || id.mrz?.surname || '')).slice(0, 128),
    fullName: fullName.slice(0, 256), fullNameEn: fullNameEn.slice(0, 256),
    gender: id.gender === 'M' ? 'MALE' : id.gender === 'F' ? 'FEMALE' : '',
    birthDate: String(id.date_of_birth || ''),
    nationality: alpha2(id.nationality || id.issuing_state),
    idType: type.includes('passport') ? 'PASSPORT' : type.includes('driv') ? 'DRIVER_LICENSE' : 'ID_CARD',
    idNumber: String(id.document_number || id.personal_number || '').slice(0, 128),
    idExpiryDate: String(id.expiration_date || ''),
    country: alpha2(parsed.country) || alpha2(id.issuing_state),
    state: String(parsed.region || '').slice(0, 128), city: String(parsed.city || '').slice(0, 128),
    street: String([parsed.street_1, parsed.street_2].filter(Boolean).join(', ')).slice(0, 256),
    postalCode: String(parsed.postal_code || '').slice(0, 32),
    address: String(id.formatted_address || id.address || '').slice(0, 512)
  };
}

export async function loadProfile(sessionId: string) {
  const decision = await diditSessionData(sessionId);
  return { decision, profile: profileFrom(decision) };
}

async function upload(bytes: ArrayBuffer, contentType: string, fileName: string, type: 'IDENTITY_PROOF' | 'SELFIE_PROOF' | 'ADDRESS_PROOF') {
  if (bytes.byteLength > 10 * 1024 * 1024) throw new HttpError(422, 'A verification file is larger than 10 MB.');
  const slot = await buvei<{ uploadUrl: string; fileToken: string }>('POST', '/kyc/presignedUploads', { fileName, contentType, type });
  const put = await fetch(slot.uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: bytes });
  if (!put.ok) throw new HttpError(502, 'A verification file could not be uploaded.');
  return slot.fileToken;
}

async function image(url: string | null) {
  if (!url) return null;
  const response = await fetch(url);
  if (!response.ok) return null;
  const type = (response.headers.get('content-type') || '').toLowerCase();
  return { bytes: await response.arrayBuffer(), type: type.includes('png') ? 'image/png' : 'image/jpeg' };
}

/** Uploads the documents and report, then submits the cardholder form. Returns Buvei's cardholder id (PENDING). */
export async function submitCardholder(sessionId: string, email: string, extras: Extras) {
  const { decision, profile } = await loadProfile(sessionId);
  const id = idOf(decision);
  const merged = {
    ...profile,
    gender: profile.gender || (extras.gender === 'MALE' || extras.gender === 'FEMALE' ? extras.gender : ''),
    idExpiryDate: profile.idExpiryDate || String(extras.idExpiryDate || ''),
    country: extras.country || profile.country, state: extras.state || profile.state, city: extras.city || profile.city,
    street: extras.street || profile.street, postalCode: extras.postalCode || profile.postalCode
  };
  const missing = Object.entries({ 'first name': merged.firstName, 'last name': merged.lastName, 'date of birth': merged.birthDate, nationality: merged.nationality, 'document number': merged.idNumber, gender: merged.gender, 'document expiry date': merged.idExpiryDate, country: merged.country, 'state or province': merged.state, city: merged.city, street: merged.street, 'postal code': merged.postalCode })
    .filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) throw new HttpError(400, `Please add your ${missing.join(', ')}.`);
  for (const code of [merged.nationality, merged.country, extras.livingCountry]) {
    if (RESTRICTED.has(code)) throw new HttpError(422, 'The ROBANK Card is not available for your country yet.');
  }

  const [front, back, selfie, pdf] = await Promise.all([image(id?.front_image || id?.full_front_image), image(id?.back_image || id?.full_back_image), image(selfieOf(decision)), diditPdf(sessionId)]);
  if (!front) throw new HttpError(409, 'Your document images are no longer available. Verify again.');
  if (merged.idType === 'ID_CARD' && !back) throw new HttpError(409, 'The back of your ID card is missing. Verify again with both sides.');
  const [idFrontToken, idBackToken, selfieToken, report] = await Promise.all([
    upload(front.bytes, front.type, `id-front.${front.type === 'image/png' ? 'png' : 'jpg'}`, 'IDENTITY_PROOF'),
    back ? upload(back.bytes, back.type, `id-back.${back.type === 'image/png' ? 'png' : 'jpg'}`, 'IDENTITY_PROOF') : Promise.resolve(undefined),
    selfie ? upload(selfie.bytes, selfie.type, `selfie.${selfie.type === 'image/png' ? 'png' : 'jpg'}`, 'SELFIE_PROOF') : Promise.resolve(undefined),
    upload(pdf, 'application/pdf', 'didit-verification-report.pdf', 'IDENTITY_PROOF')
  ]);

  const addressEn = latin([merged.street, merged.city, merged.state, merged.postalCode, merged.country].filter(Boolean).join(', '));
  const holder = await buvei<{ id: string; kycStatus: string }>('POST', '/kyc/cardholders/form', {
    firstName: merged.firstName, lastName: merged.lastName, fullName: merged.fullName || merged.fullNameEn, fullNameEn: merged.fullNameEn,
    mobilePrefix: extras.mobilePrefix, mobile: extras.mobile, email,
    gender: merged.gender, birthDate: merged.birthDate, occupation: extras.occupation, nationality: merged.nationality,
    idType: merged.idType, idNumber: merged.idNumber, idExpiryDate: merged.idExpiryDate,
    country: merged.country, state: merged.state, city: merged.city, street: merged.street,
    address: (merged.address || addressEn).slice(0, 512), addressEn: addressEn.slice(0, 512), postalCode: merged.postalCode,
    sourceOfFund: extras.sourceOfFund, livingCountry: extras.livingCountry,
    idFrontToken, ...(idBackToken ? { idBackToken } : {}), ...(selfieToken ? { selfieToken } : {}),
    attachments: [report]
  });
  if (!holder?.id) throw new HttpError(502, 'The card service did not accept the application.');
  return holder;
}
