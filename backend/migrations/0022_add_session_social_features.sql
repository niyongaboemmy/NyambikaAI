-- Session Likes: track who liked which try-on session
CREATE TABLE IF NOT EXISTS session_likes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL REFERENCES try_on_sessions(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (session_id, user_id)
);

-- Session Views: analytics tracking
CREATE TABLE IF NOT EXISTS session_views (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL REFERENCES try_on_sessions(id) ON DELETE CASCADE,
  user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- Session Comments: community comments on try-on sessions
CREATE TABLE IF NOT EXISTS session_comments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL REFERENCES try_on_sessions(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Session Saves: users saving try-on sessions
CREATE TABLE IF NOT EXISTS session_saves (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL REFERENCES try_on_sessions(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (session_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_likes_session ON session_likes(session_id);
CREATE INDEX IF NOT EXISTS idx_session_likes_user ON session_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_session_views_session ON session_views(session_id);
CREATE INDEX IF NOT EXISTS idx_session_comments_session ON session_comments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_saves_session ON session_saves(session_id);
CREATE INDEX IF NOT EXISTS idx_session_saves_user ON session_saves(user_id);
