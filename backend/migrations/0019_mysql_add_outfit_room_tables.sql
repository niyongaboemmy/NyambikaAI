-- Add new columns to try_on_sessions table (MySQL version)
-- Note: MySQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN in older versions
-- These columns will be added if they don't exist

-- Create outfit_collections table (MySQL version)
CREATE TABLE IF NOT EXISTS outfit_collections (
  id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  occasion TEXT,
  season TEXT,
  cover_image_url TEXT,
  is_public TINYINT(1) DEFAULT 0,
  likes INT DEFAULT 0,
  views INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create outfit_items table (MySQL version)
CREATE TABLE IF NOT EXISTS outfit_items (
  id VARCHAR(255) NOT NULL,
  outfit_id VARCHAR(255) NOT NULL,
  try_on_session_id VARCHAR(255),
  product_id VARCHAR(255),
  position INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (outfit_id) REFERENCES outfit_collections(id) ON DELETE CASCADE,
  FOREIGN KEY (try_on_session_id) REFERENCES try_on_sessions(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Create user_style_profiles table (MySQL version)
CREATE TABLE IF NOT EXISTS user_style_profiles (
  id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  favorite_colors TEXT,
  favorite_categories TEXT,
  preferred_brands TEXT,
  style_preferences TEXT,
  body_type TEXT,
  skin_tone TEXT,
  ai_insights TEXT,
  last_analyzed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_user_profile (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance (MySQL version)
CREATE INDEX idx_outfit_collections_user_id ON outfit_collections(user_id);
CREATE INDEX idx_outfit_items_outfit_id ON outfit_items(outfit_id);
CREATE INDEX idx_outfit_items_try_on_session_id ON outfit_items(try_on_session_id);
CREATE INDEX idx_user_style_profiles_user_id ON user_style_profiles(user_id);

-- Add columns to existing try_on_sessions table if they don't exist
-- Note: This uses a safer approach for MySQL compatibility
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_NAME = 'try_on_sessions' AND COLUMN_NAME = 'is_favorite') = 0,
  'ALTER TABLE try_on_sessions ADD COLUMN is_favorite TINYINT(1) DEFAULT 0',
  'SELECT "Column is_favorite already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_NAME = 'try_on_sessions' AND COLUMN_NAME = 'notes') = 0,
  'ALTER TABLE try_on_sessions ADD COLUMN notes TEXT',
  'SELECT "Column notes already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_NAME = 'try_on_sessions' AND COLUMN_NAME = 'rating') = 0,
  'ALTER TABLE try_on_sessions ADD COLUMN rating INT DEFAULT NULL',
  'SELECT "Column rating already exists"'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
