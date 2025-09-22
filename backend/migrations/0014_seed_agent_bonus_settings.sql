-- Postgres: seed default payment settings for referral/commission bonuses
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM payment_settings WHERE name = 'agent_signup_bonus'
  ) THEN
    INSERT INTO payment_settings (name, description, amount_in_rwf)
    VALUES ('agent_signup_bonus', 'Wallet credit when a referred agent signs up', 2000);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM payment_settings WHERE name = 'agent_referral_l1_percent'
  ) THEN
    INSERT INTO payment_settings (name, description, amount_in_rwf)
    VALUES ('agent_referral_l1_percent', 'Level 1 referral percent (basis points where 10000 = 100%)', 1000);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM payment_settings WHERE name = 'agent_referral_l2_percent'
  ) THEN
    INSERT INTO payment_settings (name, description, amount_in_rwf)
    VALUES ('agent_referral_l2_percent', 'Level 2 referral percent (basis points)', 500);
  END IF;
END $$;
