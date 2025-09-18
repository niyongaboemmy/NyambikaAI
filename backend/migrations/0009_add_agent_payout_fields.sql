-- Add agent payout confirmation fields to subscription_payments
-- Safe to run multiple times (checks existence before adding)

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_payments' AND column_name = 'agent_payout_status'
  ) THEN
    ALTER TABLE subscription_payments
      ADD COLUMN agent_payout_status TEXT DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_payments' AND column_name = 'agent_payout_date'
  ) THEN
    ALTER TABLE subscription_payments
      ADD COLUMN agent_payout_date TIMESTAMP NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_payments' AND column_name = 'agent_payout_reference'
  ) THEN
    ALTER TABLE subscription_payments
      ADD COLUMN agent_payout_reference TEXT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_payments' AND column_name = 'agent_payout_notes'
  ) THEN
    ALTER TABLE subscription_payments
      ADD COLUMN agent_payout_notes TEXT NULL;
  END IF;
END $$;
