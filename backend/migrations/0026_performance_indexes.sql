-- ══════════════════════════════════════════════════════════════
-- Migration 0026: Performance Optimization Indexes
-- Adds B-Tree indexes to scale heavily sorted or filtered tables
-- ══════════════════════════════════════════════════════════════

-- try_on_sessions: Accelerate filtering by user, tracking product popularity
CREATE INDEX IF NOT EXISTS idx_sessions_user ON try_on_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_product ON try_on_sessions (product_id);

-- try_on_sessions: Accelerate catalogue sorting and cursor/offset queries
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON try_on_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_likes ON try_on_sessions (likes DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_views ON try_on_sessions (views DESC);

-- try_on_sessions: Accelerate public catalogue payload generation where is_hidden = false
CREATE INDEX IF NOT EXISTS idx_sessions_visibility ON try_on_sessions (is_hidden);

-- session_comments: Support fast rendering of comment threads by session
CREATE INDEX IF NOT EXISTS idx_comments_session ON session_comments (session_id);
-- Compound index to query only visible comments quickly
CREATE INDEX IF NOT EXISTS idx_comments_visible ON session_comments (session_id, is_deleted) WHERE is_deleted = false;

-- outfit_collections: Support user queries
CREATE INDEX IF NOT EXISTS idx_outfits_user ON outfit_collections (user_id);

-- products & cart_items: Accelerate general e-commerce workflows
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_producer_id ON products (producer_id);
CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items (user_id);
