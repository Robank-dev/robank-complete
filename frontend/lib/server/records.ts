import { db, type D1 } from './env';
import { HttpError } from './http';

export function requireDb(): D1 {
  const database = db();
  if (!database) throw new HttpError(503, 'Records storage is not available right now.');
  return database;
}

export const now = () => new Date().toISOString();
export const newId = () => crypto.randomUUID();

export function toUpdate(row: any) {
  return { id: row.id, title: row.title ?? null, body: row.body, xUrl: row.x_url ?? null, imageUrl: row.image_url ?? null, publishedAt: row.published_at };
}

export function toCompany(row: any) {
  return {
    id: row.id, legalName: row.legal_name, registrationNumber: row.registration_number ?? null, countryCode: row.country_code,
    jurisdictionCode: row.jurisdiction_code ?? null, status: row.status, verificationStatus: row.verification_status,
    verificationUrl: row.verification_url ?? null, createdAt: row.created_at
  };
}

export function toJob(row: any, viewerId?: string) {
  const role = viewerId && row.creator_user_id === viewerId ? 'creator' : viewerId && row.worker_user_id === viewerId ? 'worker' : null;
  return {
    id: row.id, title: row.title, description: row.description, rewardAmount: row.reward_amount ?? null, rewardAsset: row.reward_asset ?? null,
    rewardChainId: row.reward_chain_id ?? null, status: row.status, creatorWallet: row.creator_wallet, workerWallet: row.worker_wallet ?? null,
    // Submissions are only visible to the two parties of the job.
    submission: role ? row.submission ?? null : null,
    payoutTxHash: row.payout_tx_hash ?? null, dueAt: row.due_at ?? null, createdAt: row.created_at, updatedAt: row.updated_at, role
  };
}
