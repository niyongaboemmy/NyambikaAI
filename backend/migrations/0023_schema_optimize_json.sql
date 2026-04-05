-- Schema optimization: merge 5 thin tables into JSON/array columns on parent tables

-- 1. Add liked_by / saved_by arrays to try_on_sessions
ALTER TABLE try_on_sessions
  ADD COLUMN IF NOT EXISTS liked_by TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS saved_by TEXT[] DEFAULT '{}';

-- Migrate existing likes/saves into arrays (if tables still exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session_likes') THEN
    UPDATE try_on_sessions t SET liked_by = ARRAY(
      SELECT user_id FROM session_likes WHERE session_id = t.id
    );
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session_saves') THEN
    UPDATE try_on_sessions t SET saved_by = ARRAY(
      SELECT user_id FROM session_saves WHERE session_id = t.id
    );
  END IF;
END $$;

-- 2. Add style_profile JSONB to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS style_profile JSONB DEFAULT '{}';

-- Migrate existing style profiles (if table still exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_style_profiles') THEN
    UPDATE users u SET style_profile = row_to_json(sp)::jsonb
    FROM user_style_profiles sp WHERE sp.user_id = u.id;
  END IF;
END $$;

-- 3. Add items JSONB to outfit_collections
ALTER TABLE outfit_collections ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';

-- Migrate existing outfit items into JSONB arrays (if table still exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'outfit_items') THEN
    UPDATE outfit_collections oc SET items = (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', oi.id,
          'tryOnSessionId', oi.try_on_session_id,
          'productId', oi.product_id,
          'position', oi.position,
          'notes', oi.notes,
          'createdAt', oi.created_at
        ) ORDER BY oi.position
      ), '[]')
      FROM outfit_items oi WHERE oi.outfit_id = oc.id
    );
  END IF;
END $$;

-- 4. Drop old tables
DROP TABLE IF EXISTS session_views;
DROP TABLE IF EXISTS session_likes;
DROP TABLE IF EXISTS session_saves;
DROP TABLE IF EXISTS user_style_profiles;
DROP TABLE IF EXISTS outfit_items;
