import { requireSession, type Session } from '@/lib/server/auth';
import { OCCUPATIONS, SOURCES, loadProfile, submitCardholder } from '@/lib/server/cardholder';
import { identityFor, startIdentity } from '@/lib/server/identity';
import { buvei, buveiConfigured, pickBin } from '@/lib/server/buvei';
import { env } from '@/lib/server/env';
import { HttpError, handle, ok, readJson, text } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { now, requireDb } from '@/lib/server/records';
import { verifyStableTransfer } from '@/lib/server/verifyTransfer';
import { ROBINHOOD_CHAIN_ID } from '@/lib/chains';

export const dynamic = 'force-dynamic';

// Card loads are paid in USDG on Robinhood Chain (6 decimals: 1 cent = 10_000 base units).
const PAY_CHAIN = ROBINHOOD_CHAIN_ID;
const PAY_ASSET = 'USDG';
const APPLICATION_CENTS = 550;     // card issuance, identity check included
const LOAD_FEE_BPS = 400;          // 4% of the amount loaded…
const LOAD_FEE_FLAT_CENTS = 50;    // …plus $0.50 per load
const MIN_LOAD_CENTS = 500;
const MAX_KYC_ATTEMPTS = 2;
const MAX_CENTS = 4_000_000;

/** Card balance credited for a load payment: paid = credit × 1.04 + $0.50. */
const creditFor = (paidCents: number) => Math.floor((paidCents - LOAD_FEE_FLAT_CENTS) * 10_000 / (10_000 + LOAD_FEE_BPS));
/** What the user must pay to load `creditCents` onto the card. */
const chargeFor = (creditCents: number) => Math.ceil(creditCents * (10_000 + LOAD_FEE_BPS) / 10_000) + LOAD_FEE_FLAT_CENTS;
const FEES = { applicationUsd: APPLICATION_CENTS / 100, loadPercent: LOAD_FEE_BPS / 100, loadFlatUsd: LOAD_FEE_FLAT_CENTS / 100 };

type Row = { user_id: string; cardholder_id: string | null; kyc_status: string | null; kyc_url: string | null; card_id: string | null; application_tx: string | null; kyc_attempts?: number };

async function record(userId: string): Promise<Row | null> {
  return requireDb().prepare('SELECT * FROM cards WHERE user_id = ?1').bind(userId).first<Row>();
}

async function save(userId: string, patch: Partial<Row>) {
  const at = now();
  const current = await record(userId);
  const next = { cardholder_id: null, kyc_status: null, kyc_url: null, card_id: null, application_tx: null, kyc_attempts: 0, ...current, ...patch };
  await requireDb().prepare(`INSERT INTO cards (user_id, cardholder_id, kyc_status, kyc_url, card_id, application_tx, kyc_attempts, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?8)
    ON CONFLICT(user_id) DO UPDATE SET cardholder_id = ?2, kyc_status = ?3, kyc_url = ?4, card_id = ?5, application_tx = ?6, kyc_attempts = ?7, updated_at = ?8`)
    .bind(userId, next.cardholder_id, next.kyc_status, next.kyc_url, next.card_id, next.application_tx, Number(next.kyc_attempts || 0), at).run();
}

/** Verifies the user's USDG payment to the ROBANK card treasury and reserves it so it can be used once. */
async function claimPayment(session: Session, txHash: string, purpose: 'application' | 'issue' | 'fund', minCents: number) {
  if (!session.evmAddress) throw new HttpError(409, 'Your wallet is still being prepared.');
  const hash = txHash.toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(hash)) throw new HttpError(400, 'Invalid transaction hash.');
  const { moved } = await verifyStableTransfer({ chainId: PAY_CHAIN, asset: PAY_ASSET, txHash: hash, from: session.evmAddress, to: env('BUVEI_TREASURY_WALLET'), minRaw: BigInt(minCents) * BigInt(10_000) });
  const cents = Number(moved / BigInt(10_000));
  if (cents > MAX_CENTS) throw new HttpError(422, 'Payments above $40,000 cannot be loaded to a card. Contact support.');
  try {
    await requireDb().prepare("INSERT INTO card_payments (tx_hash, user_id, amount_cents, purpose, status, created_at) VALUES (?1, ?2, ?3, ?4, 'processing', ?5)").bind(hash, session.userId, cents, purpose, now()).run();
  } catch {
    const existing: any = await requireDb().prepare('SELECT * FROM card_payments WHERE tx_hash = ?1').bind(hash).first();
    if (existing?.user_id !== session.userId || existing?.status === 'done') throw new HttpError(409, 'This payment has already been used.');
    // Same user retrying a payment that did not finish: fall through and retry with the same idempotency key.
  }
  return { hash, cents };
}

const markPayment = (hash: string, status: 'done' | 'failed') => requireDb().prepare('UPDATE card_payments SET status = ?2 WHERE tx_hash = ?1').bind(hash, status).run();

function view(card: any) {
  return card && {
    cardId: card.cardId, status: card.status, cardNumber: card.cardNumber, brand: card.brand, cardholderName: card.cardholderName,
    availableBalance: Number(card.availableBalance || 0) / 100, totalConsumption: Number(card.totalConsumption || 0) / 100
  };
}

export const GET = handle(async (request: Request) => {
  const session = await requireSession(request);
  const enabled = buveiConfigured();
  const row = await record(session.userId);
  const identity = await identityFor(session.userId).catch(() => ({ status: 'not_started' as const, url: null, sessionId: null }));
  const base = { enabled, fees: FEES, applicationPaid: Boolean(row?.application_tx), identity: { status: identity.status, url: identity.url }, options: { occupations: OCCUPATIONS, sources: SOURCES },
    payment: { chainId: PAY_CHAIN, asset: PAY_ASSET, address: enabled ? env('BUVEI_TREASURY_WALLET') : null, minIssueUsd: MIN_LOAD_CENTS / 100, minFundUsd: MIN_LOAD_CENTS / 100 } };
  const attemptsLeft = Math.max(0, MAX_KYC_ATTEMPTS - Number(row?.kyc_attempts || 0));

  if (enabled && row?.card_id) {
    const card = await buvei('GET', `/cards/${encodeURIComponent(row.card_id)}`).catch(() => null);
    const tx = card ? await buvei<any>('GET', `/cards/${encodeURIComponent(row.card_id)}/transactions?page=1&size=20`).catch(() => null) : null;
    return ok({ ...base, stage: 'issued', card: view(card), cardUnavailable: !card, transactions: (tx?.records || []).map((t: any) => ({ id: t.transactionId, description: t.description, amount: Number(t.amount ?? t.transactionAmount ?? 0) / 100, currency: t.currency || 'USD', status: t.status, at: t.createdAt || t.transactionTime || null })) });
  }

  // Card application (Buvei cardholder) — reviewed by Buvei after ROBANK's identity check.
  let holderStatus = row?.cardholder_id ? row.kyc_status : null;
  if (enabled && row?.cardholder_id && holderStatus !== 'APPROVED') {
    const holder = await buvei<any>('GET', `/kyc/cardholders/${encodeURIComponent(row.cardholder_id)}`).catch(() => null);
    if (holder?.kycStatus && holder.kycStatus !== holderStatus) { holderStatus = String(holder.kycStatus); await save(session.userId, { kyc_status: holderStatus }); }
  }
  const verified = identity.status === 'approved' || holderStatus === 'APPROVED';
  const stage = holderStatus === 'APPROVED' ? 'ready-to-issue'
    : holderStatus === 'PENDING' ? (row?.kyc_url ? 'kyc-pending' : 'review')
      : verified ? (holderStatus === 'REJECTED' && !attemptsLeft ? 'review-rejected' : 'apply')
        : ['pending', 'in_review'].includes(identity.status) ? 'kyc-pending' : identity.status === 'declined' ? 'kyc-rejected' : 'none';

  // Prefill the application from the verified document so the user only adds what Didit cannot know.
  let prefill = null;
  if (stage === 'apply' && identity.sessionId) {
    const loaded = await loadProfile(identity.sessionId).catch(() => null);
    if (loaded) {
      const p = loaded.profile;
      prefill = { name: p.fullNameEn || `${p.firstName} ${p.lastName}`, birthDate: p.birthDate, nationality: p.nationality, idType: p.idType, gender: p.gender, idExpiryDate: p.idExpiryDate, country: p.country, state: p.state, city: p.city, street: p.street, postalCode: p.postalCode };
    }
  }
  return ok({ ...base, stage, applicationRejected: holderStatus === 'REJECTED', kycUrl: stage === 'kyc-pending' ? (identity.url || row?.kyc_url || null) : null, kycAttemptsLeft: attemptsLeft, prefill, card: null });
});

export const POST = handle(async (request: Request) => {
  const session = await requireSession(request, { allowApiKey: false });
  await rateLimit(`card:${session.userId}`, 30, 3600);
  if (!buveiConfigured()) throw new HttpError(503, 'The card service is being activated. Please try again soon.');
  const body = await readJson(request, 16_000);
  const action = String(body.action || '');
  const row = await record(session.userId);

  // Step 1: identity check with ROBANK's own Didit account (free for the user).
  if (action === 'verify') {
    if (row?.card_id) throw new HttpError(409, 'You already have a card.');
    return ok(await startIdentity(session.userId, '/card'));
  }

  // Step 2: the card application — the verified Didit data, documents and report go to Buvei for review.
  if (action === 'apply') {
    if (row?.card_id) throw new HttpError(409, 'You already have a card.');
    if (row?.cardholder_id && ['PENDING', 'APPROVED'].includes(String(row.kyc_status))) throw new HttpError(409, 'Your card application is already submitted.');
    if (Number(row?.kyc_attempts || 0) >= MAX_KYC_ATTEMPTS) throw new HttpError(429, 'You have used all application attempts. Contact support to try again.');
    const identity = await identityFor(session.userId);
    if (identity.status !== 'approved' || !identity.sessionId) throw new HttpError(409, 'Verify your identity first.');
    if (!session.email) throw new HttpError(409, 'Your account has no email address.');
    const f = (body.profile && typeof body.profile === 'object' ? body.profile : {}) as Record<string, unknown>;
    const field = (name: string, max: number, label: string, required = false) => text(f[name], { max, required, name: label });
    const extras = {
      mobilePrefix: field('mobilePrefix', 4, 'Country calling code', true).replace(/\D/g, ''),
      mobile: field('mobile', 20, 'Mobile number', true).replace(/\D/g, ''),
      occupation: field('occupation', 60, 'Occupation', true),
      sourceOfFund: field('sourceOfFund', 60, 'Source of funds', true),
      livingCountry: field('livingCountry', 2, 'Country of residence', true).toUpperCase(),
      country: field('country', 2, 'Country').toUpperCase(), state: field('state', 128, 'State or province'), city: field('city', 128, 'City'),
      street: field('street', 256, 'Street'), postalCode: field('postalCode', 32, 'Postal code'),
      gender: field('gender', 6, 'Gender').toUpperCase(), idExpiryDate: field('idExpiryDate', 10, 'Document expiry date')
    };
    if (!/^\d{1,4}$/.test(extras.mobilePrefix) || !/^\d{4,20}$/.test(extras.mobile)) throw new HttpError(400, 'Enter a valid mobile number.');
    if (!(OCCUPATIONS as readonly string[]).includes(extras.occupation)) throw new HttpError(400, 'Choose your occupation.');
    if (!(SOURCES as readonly string[]).includes(extras.sourceOfFund)) throw new HttpError(400, 'Choose your source of funds.');
    if (!/^[A-Z]{2}$/.test(extras.livingCountry) || (extras.country && !/^[A-Z]{2}$/.test(extras.country))) throw new HttpError(400, 'Choose a valid country.');
    if (extras.idExpiryDate && (!/^\d{4}-\d{2}-\d{2}$/.test(extras.idExpiryDate) || new Date(extras.idExpiryDate).getTime() < Date.now())) throw new HttpError(400, 'Enter a valid, unexpired document expiry date.');
    const holder = await submitCardholder(identity.sessionId, session.email, extras);
    await save(session.userId, { cardholder_id: String(holder.id), kyc_status: String(holder.kycStatus || 'PENDING'), kyc_url: null, kyc_attempts: Number(row?.kyc_attempts || 0) + 1 });
    return ok({ status: 'PENDING' });
  }

  if (action === 'issue') {
    if (row?.card_id) throw new HttpError(409, 'You already have a card.');
    const bin = await pickBin();
    if (!bin) throw new HttpError(503, 'No card program is available right now.');
    if (row?.kyc_status !== 'APPROVED') throw new HttpError(409, 'Verify your identity first.');
    // One payment covers the one-time $5.50 card fee (unless paid by an earlier transaction) and the starting balance.
    const txHash = text(body.txHash, { max: 66, required: true, name: 'Transaction' }).toLowerCase();
    const cardFee = !row?.application_tx || row.application_tx === txHash ? APPLICATION_CENTS : 0;
    const { hash, cents: paid } = await claimPayment(session, txHash, 'issue', cardFee + chargeFor(MIN_LOAD_CENTS));
    const cents = creditFor(paid - cardFee);
    if (cardFee) await save(session.userId, { application_tx: hash });
    try {
      const card = await buvei<any>('POST', '/cards', {
        cardBinId: bin.cardBinId, initialAmount: cents,
        ...(row?.cardholder_id ? { cardholderId: row.cardholder_id } : {}),
        ...(bin.email && session.email ? { email: session.email } : {}),
        tags: ['robank']
      }, `iss_${hash.slice(2, 50)}`);
      if (!card?.cardId) throw new HttpError(502, 'The card service did not return a card.');
      await save(session.userId, { card_id: String(card.cardId) });
      await markPayment(hash, 'done');
      return ok({ card: view(card), creditedUsd: cents / 100, feeUsd: (paid - cents) / 100 });
    } catch (error) {
      await markPayment(hash, 'failed').catch(() => undefined);
      throw error;
    }
  }

  if (!row?.card_id) throw new HttpError(404, 'You do not have a card yet.');
  const cardPath = `/cards/${encodeURIComponent(row.card_id)}`;

  if (action === 'fund') {
    const { hash, cents: paid } = await claimPayment(session, text(body.txHash, { max: 66, required: true, name: 'Transaction' }), 'fund', chargeFor(MIN_LOAD_CENTS));
    const cents = creditFor(paid);
    try {
      await buvei('POST', `${cardPath}/funding`, { amount: cents }, `fund_${hash.slice(2, 50)}`);
      await markPayment(hash, 'done');
      return ok({ fundedUsd: cents / 100, feeUsd: (paid - cents) / 100 });
    } catch (error) {
      await markPayment(hash, 'failed').catch(() => undefined);
      throw error;
    }
  }
  if (action === 'reveal') {
    await rateLimit(`card:reveal:${session.userId}`, 5, 600);
    const s = await buvei<any>('GET', `${cardPath}/sensitive`);
    return ok({ sensitive: { cardNumber: s?.cardNumber, cvv: s?.cvv, expiryMonth: s?.expiryMonth, expiryYear: s?.expiryYear } });
  }
  if (action === 'freeze' || action === 'unfreeze') {
    await buvei('POST', `${cardPath}/${action}`);
    return ok({ ok: true });
  }
  throw new HttpError(400, 'Unknown action.');
});
