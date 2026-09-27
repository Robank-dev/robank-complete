import { requireSession } from '@/lib/server/auth';
import { buvei, buveiConfigured } from '@/lib/server/buvei';
import { env } from '@/lib/server/env';
import { HttpError, handle, ok, readJson, text } from '@/lib/server/http';
import { rateLimit } from '@/lib/server/rateLimit';
import { now, requireDb } from '@/lib/server/records';
import { verifyStableTransfer } from '@/lib/server/verifyTransfer';
import { ROBINHOOD_CHAIN_ID } from '@/lib/chains';

export const dynamic = 'force-dynamic';

// Cash-outs are paid in USDG on Robinhood Chain (6 decimals: 1 cent = 10_000 base units) and delivered by PayPal.
const CURRENCIES = ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'MXN'] as const;
const FEE_BPS = 200;          // 2% of the amount cashed out…
const MIN_FEE_CENTS = 100;    // …at least $1.00
const MIN_CENTS = 500;
const MAX_CENTS = 500_000;
const TERMINAL = ['SUCCESS', 'FAILED', 'CANCELED'];

const feeFor = (usdCents: number) => Math.max(MIN_FEE_CENTS, Math.ceil(usdCents * FEE_BPS / 10_000));
const FEES = { percent: FEE_BPS / 100, minUsd: MIN_FEE_CENTS / 100, minUsdAmount: MIN_CENTS / 100, maxUsdAmount: MAX_CENTS / 100 };

type Row = { tx_hash: string; usd_cents: number; fee_cents: number; paid_cents: number; currency: string; arrive_amount: number | null; paypal_email: string; mer_order_no: string | null; status: string; created_at: string };

const view = (r: Row) => ({
  id: r.tx_hash, usd: r.usd_cents / 100, fee: r.fee_cents / 100, currency: r.currency,
  arrive: r.arrive_amount != null ? r.arrive_amount / 100 : null, paypal: r.paypal_email, status: r.status, at: r.created_at
});

/** One identity check for everything: the card verification (Buvei's Didit flow), or an earlier ROBANK Didit check. */
async function kycApproved(userId: string) {
  const database = requireDb();
  const card = await database.prepare('SELECT kyc_status FROM cards WHERE user_id = ?1').bind(userId).first<{ kyc_status: string | null }>();
  if (card?.kyc_status === 'APPROVED') return true;
  const legacy = await database.prepare('SELECT status FROM kyc WHERE user_id = ?1').bind(userId).first<{ status: string }>().catch(() => null);
  return legacy?.status === 'approved';
}

/** Buvei's USD → currency rate, margin included. */
async function rateFor(currency: string) {
  const r = await buvei<{ rate: number }>('POST', '/payouts/rate', { targetCurrency: currency });
  const rate = Number(r?.rate);
  if (!Number.isFinite(rate) || rate <= 0) throw new HttpError(502, 'The payout rate is unavailable right now.');
  return rate;
}

/** Refreshes payouts that have not reached a final state (webhooks are the primary signal). */
async function sync(rows: Row[]) {
  const open = rows.filter((r) => r.mer_order_no && !TERMINAL.includes(r.status)).slice(0, 5);
  await Promise.all(open.map(async (r) => {
    const p = await buvei<any>('GET', `/payouts/${encodeURIComponent(r.mer_order_no!)}`).catch(() => null);
    if (p?.status && p.status !== r.status) {
      r.status = String(p.status);
      await requireDb().prepare('UPDATE cashouts SET status = ?2, updated_at = ?3 WHERE tx_hash = ?1').bind(r.tx_hash, r.status, now()).run();
    }
  }));
}

export const GET = handle(async (request: Request) => {
  const session = await requireSession(request);
  const enabled = buveiConfigured();
  const { results } = await requireDb().prepare('SELECT * FROM cashouts WHERE user_id = ?1 ORDER BY created_at DESC LIMIT 20').bind(session.userId).all<Row>();
  if (enabled) await sync(results).catch(() => undefined);
  return ok({
    enabled, fees: FEES, currencies: CURRENCIES, kycApproved: await kycApproved(session.userId),
    payment: { chainId: ROBINHOOD_CHAIN_ID, asset: 'USDG', address: enabled ? env('BUVEI_TREASURY_WALLET') : null },
    cashouts: results.map(view)
  });
});

export const POST = handle(async (request: Request) => {
  const session = await requireSession(request, { allowApiKey: false });
  await rateLimit(`cashout:${session.userId}`, 20, 3600);
  if (!buveiConfigured()) throw new HttpError(503, 'Cash out is being activated. Please try again soon.');
  const body = await readJson(request);
  const currency = text(body.currency, { max: 3, required: true, name: 'Currency' }).toUpperCase();
  if (!(CURRENCIES as readonly string[]).includes(currency)) throw new HttpError(400, 'Choose a supported currency.');

  if (body.action === 'rate') return ok({ rate: await rateFor(currency) });
  if (body.action !== 'create') throw new HttpError(400, 'Unknown action.');

  if (!(await kycApproved(session.userId))) throw new HttpError(403, 'Verify your identity before cashing out.');
  if (!session.evmAddress) throw new HttpError(409, 'Your wallet is still being prepared.');
  const usdCents = Math.round(Number(body.usd) * 100);
  if (!Number.isInteger(usdCents) || usdCents < MIN_CENTS || usdCents > MAX_CENTS) throw new HttpError(400, `Cash out between $${MIN_CENTS / 100} and $${MAX_CENTS / 100}.`);
  const email = text(body.paypal, { max: 160, required: true, name: 'PayPal email' }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new HttpError(400, 'Enter the email address of your PayPal account.');
  const firstName = text(body.firstName, { max: 60, required: true, name: 'First name' });
  const lastName = text(body.lastName, { max: 60, required: true, name: 'Last name' });
  const hash = text(body.txHash, { max: 66, required: true, name: 'Transaction' }).toLowerCase();
  if (!/^0x[a-f0-9]{64}$/.test(hash)) throw new HttpError(400, 'Invalid transaction hash.');

  const database = requireDb();
  const existing = await database.prepare('SELECT * FROM cashouts WHERE tx_hash = ?1').bind(hash).first<Row & { user_id: string }>();
  if (existing && (existing.user_id !== session.userId || existing.mer_order_no)) {
    if (existing.user_id === session.userId) return ok({ cashout: view(existing) });
    throw new HttpError(409, 'This payment has already been used.');
  }

  const fee = feeFor(usdCents);
  const { moved } = await verifyStableTransfer({ chainId: ROBINHOOD_CHAIN_ID, asset: 'USDG', txHash: hash, from: session.evmAddress, to: env('BUVEI_TREASURY_WALLET'), minRaw: BigInt(usdCents + fee) * BigInt(10_000) });
  const paid = Number(moved / BigInt(10_000));
  const at = now();
  if (!existing) {
    await database.prepare(`INSERT INTO cashouts (tx_hash, user_id, paid_cents, usd_cents, fee_cents, currency, paypal_email, first_name, last_name, status, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, 'PROCESSING', ?10, ?10)`).bind(hash, session.userId, paid, usdCents, fee, currency, email, firstName, lastName, at).run();
  }
  // The rate already carries Buvei's margin, so the wallet debit (settleAmount) stays within what the user paid for.
  const rate = currency === 'USD' ? Math.min(1, await rateFor('USD')) : await rateFor(currency);
  const arrive = Math.floor(usdCents * rate);
  try {
    const payout = await buvei<any>('POST', '/payouts', {
      paymentType: 'PayPal', arriveCurrency: currency, arriveAmount: arrive,
      payee: { firstName, lastName, accountNo: email, payeeType: 'PERSON' },
      remark: `ROBANK cash out ${hash.slice(0, 18)}`
    }, `po_${hash.slice(2, 60)}`);
    await database.prepare('UPDATE cashouts SET mer_order_no = ?2, arrive_amount = ?3, status = ?4, updated_at = ?5 WHERE tx_hash = ?1')
      .bind(hash, String(payout?.merOrderNo || ''), arrive, String(payout?.status || 'PENDING'), now()).run();
  } catch (error) {
    await database.prepare("UPDATE cashouts SET status = 'RETRY', updated_at = ?2 WHERE tx_hash = ?1").bind(hash, now()).run();
    throw error;
  }
  const row = await database.prepare('SELECT * FROM cashouts WHERE tx_hash = ?1').bind(hash).first<Row>();
  return ok({ cashout: view(row!) });
});
