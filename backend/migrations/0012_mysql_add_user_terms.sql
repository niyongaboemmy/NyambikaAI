-- Add agent terms acceptance fields to users table (MySQL)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP NULL;
