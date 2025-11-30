-- Add new columns to try_on_sessions table
ALTER TABLE try_on_sessions ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
ALTER TABLE try_on_sessions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE try_on_sessions ADD COLUMN IF NOT EXISTS rating INTEGER;

-- Create outfit_collections table
CREATE TABLE IF NOT EXISTS outfit_collections (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  occasion TEXT,
  season TEXT,
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create outfit_items table
CREATE TABLE IF NOT EXISTS outfit_items (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id VARCHAR(255) NOT NULL REFERENCES outfit_collections(id),
  try_on_session_id VARCHAR(255) REFERENCES try_on_sessions(id),
  product_id VARCHAR(255) REFERENCES products(id),
  position INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_style_profiles table
CREATE TABLE IF NOT EXISTS user_style_profiles (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL UNIQUE REFERENCES users(id),
  favorite_colors TEXT[],
  favorite_categories TEXT[],
  preferred_brands TEXT[],
  style_preferences TEXT,
  body_type TEXT,
  skin_tone TEXT,
  ai_insights TEXT,
  last_analyzed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_outfit_collections_user_id ON outfit_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_items_outfit_id ON outfit_items(outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_items_try_on_session_id ON outfit_items(try_on_session_id);
CREATE INDEX IF NOT EXISTS idx_user_style_profiles_user_id ON user_style_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_try_on_sessions_is_favorite ON try_on_sessions(is_favorite);
