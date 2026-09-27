-- Identity verification is free to start, limited per account (Buvei charges the project per attempt).
ALTER TABLE cards ADD COLUMN kyc_attempts INTEGER NOT NULL DEFAULT 0;
