-- PayPal cash-outs paid through Buvei Payouts. Each USDG payment backs exactly one payout.
CREATE TABLE IF NOT EXISTS cashouts (
  tx_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  paid_cents INTEGER NOT NULL,
  usd_cents INTEGER NOT NULL,
  fee_cents INTEGER NOT NULL,
  currency TEXT NOT NULL,
  arrive_amount INTEGER,
  paypal_email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  mer_order_no TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS cashouts_user ON cashouts (user_id, created_at);
CREATE INDEX IF NOT EXISTS cashouts_order ON cashouts (mer_order_no);
