-- Postgres migration: add referral fields and agent_commissions table
-- 1) Extend users with referral fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by varchar,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Unique code for ease of sharing (ignore duplicates if already exist)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'users_referral_code_unique'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX users_referral_code_unique ON users (referral_code)';
  END IF;
END $$;

-- Optional FK to prevent orphans (kept nullable; set null on delete)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'users_referred_by_fkey' AND table_name = 'users'
  ) THEN
    EXECUTE 'ALTER TABLE users
      ADD CONSTRAINT users_referred_by_fkey
      FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL';
  END IF;
END $$;

-- Helpful index for lookups by parent
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_referred_by'
  ) THEN
    EXECUTE 'CREATE INDEX idx_users_referred_by ON users (referred_by)';
  END IF;
END $$;

-- 2) Create agent_commissions table
CREATE TABLE IF NOT EXISTS agent_commissions (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id varchar NOT NULL REFERENCES users(id),
  source_agent_id varchar NOT NULL REFERENCES users(id),
  subscription_payment_id varchar NOT NULL REFERENCES subscription_payments(id),
  level integer NOT NULL,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp DEFAULT now()
);

-- Indexes for analytics and querying
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agent_commissions_agent'
  ) THEN
    EXECUTE 'CREATE INDEX idx_agent_commissions_agent ON agent_commissions (agent_id)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agent_commissions_source'
  ) THEN
    EXECUTE 'CREATE INDEX idx_agent_commissions_source ON agent_commissions (source_agent_id)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agent_commissions_payment'
  ) THEN
    EXECUTE 'CREATE INDEX idx_agent_commissions_payment ON agent_commissions (subscription_payment_id)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agent_commissions_level'
  ) THEN
    EXECUTE 'CREATE INDEX idx_agent_commissions_level ON agent_commissions (level)';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agent_commissions_status'
  ) THEN
    EXECUTE 'CREATE INDEX idx_agent_commissions_status ON agent_commissions (status)';
  END IF;
END $$;
