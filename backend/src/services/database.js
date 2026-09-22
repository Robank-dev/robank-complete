import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;
const memoryUsers = new Map();
const pool = config.databaseUrl ? new Pool({ connectionString: config.databaseUrl, ssl: { rejectUnauthorized: false } }) : null;

export async function initDatabase() {
  if (!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    wallet_address TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}

export async function registerUser(walletAddress) {
  const normalized = walletAddress.toLowerCase();
  if (!pool) {
    memoryUsers.set(normalized, { walletAddress: normalized, createdAt: new Date().toISOString() });
    return memoryUsers.get(normalized);
  }
  const result = await pool.query(
    'INSERT INTO users (wallet_address) VALUES ($1) ON CONFLICT (wallet_address) DO UPDATE SET wallet_address = EXCLUDED.wallet_address RETURNING wallet_address, created_at',
    [normalized]
  );
  return result.rows[0];
}
