-- MySQL Migration: Add Session Social Features (Likes, Comments, Saves, Views)
-- This migration adds support for likes, comments, saves, and view tracking on try-on sessions

-- 1. Alter try_on_sessions table to add new fields (only if they don't exist)
-- Note: Using individual ALTER statements for better compatibility
-- These will fail silently if columns already exist, which is expected

-- Check and add is_hidden column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'try_on_sessions' AND COLUMN_NAME = 'is_hidden' AND TABLE_SCHEMA = DATABASE());
SET @sql = IF(@col_exists = 0, 'ALTER TABLE try_on_sessions ADD COLUMN is_hidden TINYINT(1) DEFAULT 0 AFTER status', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add likes column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'try_on_sessions' AND COLUMN_NAME = 'likes' AND TABLE_SCHEMA = DATABASE());
SET @sql = IF(@col_exists = 0, 'ALTER TABLE try_on_sessions ADD COLUMN likes INT DEFAULT 0 AFTER is_hidden', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add views column
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'try_on_sessions' AND COLUMN_NAME = 'views' AND TABLE_SCHEMA = DATABASE());
SET @sql = IF(@col_exists = 0, 'ALTER TABLE try_on_sessions ADD COLUMN views INT DEFAULT 0 AFTER likes', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create indexes for better query performance on try_on_sessions
CREATE INDEX idx_try_on_sessions_is_hidden ON try_on_sessions(is_hidden);
CREATE INDEX idx_try_on_sessions_user_id_hidden ON try_on_sessions(user_id, is_hidden);

-- 2. Create session_likes table - Track who liked which sessions
CREATE TABLE session_likes (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_session_like (session_id, user_id),
  FOREIGN KEY (session_id) REFERENCES try_on_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_session_likes_session_id (session_id),
  INDEX idx_session_likes_user_id (user_id)
);

-- 3. Create session_views table - Track views for analytics
CREATE TABLE session_views (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES try_on_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_session_views_session_id (session_id),
  INDEX idx_session_views_user_id (user_id),
  INDEX idx_session_views_viewed_at (viewed_at)
);

-- 4. Create session_comments table - Comments on try-on sessions
CREATE TABLE session_comments (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  is_deleted TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES try_on_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_session_comments_session_id (session_id),
  INDEX idx_session_comments_user_id (user_id),
  INDEX idx_session_comments_is_deleted (is_deleted)
);

-- 5. Create session_saves table - Track which users saved which sessions
CREATE TABLE session_saves (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_session_save (session_id, user_id),
  FOREIGN KEY (session_id) REFERENCES try_on_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_session_saves_session_id (session_id),
  INDEX idx_session_saves_user_id (user_id)
);
