-- Personal identity verification (Didit KYC), one row per user.
CREATE TABLE IF NOT EXISTS kyc (
  user_id TEXT PRIMARY KEY,
  session_id TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Extra company details collected for business verification (Didit KYB).
ALTER TABLE companies ADD COLUMN entity_type TEXT;
ALTER TABLE companies ADD COLUMN incorporation_date TEXT;
ALTER TABLE companies ADD COLUMN tax_id TEXT;
ALTER TABLE companies ADD COLUMN website TEXT;
ALTER TABLE companies ADD COLUMN industry TEXT;
ALTER TABLE companies ADD COLUMN address_line TEXT;
ALTER TABLE companies ADD COLUMN city TEXT;
ALTER TABLE companies ADD COLUMN postal_code TEXT;
ALTER TABLE companies ADD COLUMN contact_email TEXT;
ALTER TABLE companies ADD COLUMN verified_at TEXT;

-- The card application fee ($5 card + $0.50 identity check) is paid once, before identity verification.
ALTER TABLE cards ADD COLUMN application_tx TEXT;

-- Cached snapshot of x402 services that accept USDG on Robinhood Chain.
CREATE TABLE IF NOT EXISTS market_cache (
  id TEXT PRIMARY KEY,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
