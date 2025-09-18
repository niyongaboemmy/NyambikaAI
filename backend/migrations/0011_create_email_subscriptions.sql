-- Create email_subscriptions table for Postgres
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  created_at TIMESTAMP DEFAULT now()
);
