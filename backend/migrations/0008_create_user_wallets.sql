-- Create user_wallets and wallet_payments tables if they do not exist

CREATE TABLE IF NOT EXISTS user_wallets (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_payments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id VARCHAR NOT NULL REFERENCES user_wallets(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'topup', -- topup | debit
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'RWF',
  method TEXT NOT NULL DEFAULT 'mobile_money',
  provider TEXT DEFAULT 'mtn',
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | completed | failed
  external_reference TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_payments_user_id ON wallet_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_payments_wallet_id ON wallet_payments(wallet_id);
