-- Add missing columns to try_on_sessions that exist in schema but were never migrated
ALTER TABLE try_on_sessions
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_try_on_sessions_is_hidden ON try_on_sessions(is_hidden);
CREATE INDEX IF NOT EXISTS idx_try_on_sessions_likes ON try_on_sessions(likes DESC);
