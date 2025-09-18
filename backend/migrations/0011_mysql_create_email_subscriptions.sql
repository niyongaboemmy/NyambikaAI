-- Create email_subscriptions table for MySQL
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_email_subscriptions_email (email(191))
);
