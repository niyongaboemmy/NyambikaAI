-- MySQL migration: add agent payout fields to subscription_payments if missing
-- Safe to run multiple times

ALTER TABLE subscription_payments
  ADD COLUMN IF NOT EXISTS agent_payout_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS agent_payout_date TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS agent_payout_reference TEXT NULL,
  ADD COLUMN IF NOT EXISTS agent_payout_notes TEXT NULL;
