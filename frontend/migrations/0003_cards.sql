CREATE TABLE IF NOT EXISTS cards (
  user_id TEXT PRIMARY KEY,
  cardholder_id TEXT,
  kyc_status TEXT,
  kyc_url TEXT,
  card_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
-- Every on-chain payment can fund a card exactly once.
CREATE TABLE IF NOT EXISTS card_payments (
  tx_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
