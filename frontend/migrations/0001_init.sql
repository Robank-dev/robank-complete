-- ROBANK core records. Money never lives here: balances and settlement are read on-chain.
CREATE TABLE IF NOT EXISTS updates (
  id TEXT PRIMARY KEY,
  author_user_id TEXT NOT NULL,
  title TEXT,
  body TEXT NOT NULL,
  x_url TEXT,
  image_url TEXT,
  published_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_updates_published ON updates (published_at DESC);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  registration_number TEXT,
  country_code TEXT NOT NULL,
  jurisdiction_code TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  verification_status TEXT NOT NULL DEFAULT 'not_started',
  verification_session_id TEXT,
  verification_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_companies_owner ON companies (owner_user_id);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  creator_user_id TEXT NOT NULL,
  creator_wallet TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward_amount TEXT,
  reward_asset TEXT,
  reward_chain_id INTEGER,
  status TEXT NOT NULL DEFAULT 'open',
  worker_user_id TEXT,
  worker_wallet TEXT,
  submission TEXT,
  payout_tx_hash TEXT,
  due_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_creator ON jobs (creator_user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_worker ON jobs (worker_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_payout_tx ON jobs (payout_tx_hash) WHERE payout_tx_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL
);
