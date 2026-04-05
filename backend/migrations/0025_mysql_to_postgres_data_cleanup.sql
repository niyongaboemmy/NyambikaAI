-- ══════════════════════════════════════════════════════════════
-- Migration 0025: MySQL → PostgreSQL data format cleanup
-- Ensures all JSONB/array columns contain valid typed data,
-- not legacy MySQL-style JSON strings.
-- ══════════════════════════════════════════════════════════════

-- ── 1. users.style_profile ────────────────────────────────────
-- Old MySQL rows may have stored this as a JSON *string* like '"{}"'
-- (double-encoded) instead of a JSONB object {}. Repair those.
UPDATE users
SET style_profile = '{}'::jsonb
WHERE style_profile IS NULL
   OR jsonb_typeof(style_profile) = 'string';   -- double-encoded strings

-- Also ensure any NULL values default to empty object
UPDATE users
SET style_profile = '{}'::jsonb
WHERE style_profile IS NULL;

-- ── 2. outfit_collections.items ───────────────────────────────
-- Same issue: old rows may have '[]' stored as a JSON string,
-- not an actual JSONB array.
UPDATE outfit_collections
SET items = '[]'::jsonb
WHERE items IS NULL
   OR jsonb_typeof(items) = 'string';   -- double-encoded like '"[]"'

UPDATE outfit_collections
SET items = '[]'::jsonb
WHERE items IS NULL;

-- ── 3. try_on_sessions.liked_by / saved_by ────────────────────
-- These are TEXT[] arrays. Old MySQL rows might have NULL instead of {}.
UPDATE try_on_sessions
SET liked_by = '{}'
WHERE liked_by IS NULL;

UPDATE try_on_sessions
SET saved_by = '{}'
WHERE saved_by IS NULL;

-- ── 4. try_on_sessions.likes / views / is_hidden ──────────────
-- Ensure numeric defaults (may be NULL if rows existed before migration 0024)
UPDATE try_on_sessions SET likes    = 0     WHERE likes    IS NULL;
UPDATE try_on_sessions SET views    = 0     WHERE views    IS NULL;
UPDATE try_on_sessions SET is_hidden = false WHERE is_hidden IS NULL;

-- ── 5. try_on_sessions.fit_recommendation ─────────────────────
-- Stored as a text JSON string (not JSONB). This is intentional per the
-- current schema (text column). No type change needed—just ensure
-- non-JSON values are cleared to avoid parse errors on the frontend.
UPDATE try_on_sessions
SET fit_recommendation = NULL
WHERE fit_recommendation IS NOT NULL
  AND fit_recommendation NOT LIKE '{%'
  AND fit_recommendation NOT LIKE '[%'
  AND fit_recommendation != '';

-- ── 6. products.additional_images / sizes / colors ────────────
-- These are TEXT[] arrays from PostgreSQL. Old MySQL rows may have
-- stored them as JSON strings like '["S","M","L"]'. Convert those.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, sizes, colors, "additional_images" FROM products
    WHERE sizes IS NOT NULL
      AND array_length(sizes, 1) = 1
      AND sizes[1] LIKE '[%'
  LOOP
    BEGIN
      UPDATE products
      SET sizes = ARRAY(
        SELECT jsonb_array_elements_text(sizes[1]::jsonb)
      )
      WHERE id = r.id;
    EXCEPTION WHEN OTHERS THEN
      -- If it's not valid JSON, leave as-is
      NULL;
    END;
  END LOOP;

  FOR r IN
    SELECT id, colors FROM products
    WHERE colors IS NOT NULL
      AND array_length(colors, 1) = 1
      AND colors[1] LIKE '[%'
  LOOP
    BEGIN
      UPDATE products
      SET colors = ARRAY(
        SELECT jsonb_array_elements_text(colors[1]::jsonb)
      )
      WHERE id = r.id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  FOR r IN
    SELECT id, "additional_images" FROM products
    WHERE "additional_images" IS NOT NULL
      AND array_length("additional_images", 1) = 1
      AND "additional_images"[1] LIKE '[%'
  LOOP
    BEGIN
      UPDATE products
      SET "additional_images" = ARRAY(
        SELECT jsonb_array_elements_text("additional_images"[1]::jsonb)
      )
      WHERE id = r.id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- ── 7. orders.size_evidence_images ────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, size_evidence_images FROM orders
    WHERE size_evidence_images IS NOT NULL
      AND array_length(size_evidence_images, 1) = 1
      AND size_evidence_images[1] LIKE '[%'
  LOOP
    BEGIN
      UPDATE orders
      SET size_evidence_images = ARRAY(
        SELECT jsonb_array_elements_text(size_evidence_images[1]::jsonb)
      )
      WHERE id = r.id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- ── 8. subscription_plans.features / features_rw ──────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, features, features_rw FROM subscription_plans
    WHERE features IS NOT NULL
      AND array_length(features, 1) = 1
      AND features[1] LIKE '[%'
  LOOP
    BEGIN
      UPDATE subscription_plans
      SET features = ARRAY(
        SELECT jsonb_array_elements_text(features[1]::jsonb)
      )
      WHERE id = r.id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  FOR r IN
    SELECT id, features_rw FROM subscription_plans
    WHERE features_rw IS NOT NULL
      AND array_length(features_rw, 1) = 1
      AND features_rw[1] LIKE '[%'
  LOOP
    BEGIN
      UPDATE subscription_plans
      SET features_rw = ARRAY(
        SELECT jsonb_array_elements_text(features_rw[1]::jsonb)
      )
      WHERE id = r.id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- ── Verification ──────────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM users WHERE style_profile IS NULL)             AS users_null_style_profile,
  (SELECT COUNT(*) FROM outfit_collections WHERE items IS NULL)         AS outfits_null_items,
  (SELECT COUNT(*) FROM try_on_sessions WHERE liked_by IS NULL)         AS sessions_null_liked_by,
  (SELECT COUNT(*) FROM try_on_sessions WHERE saved_by IS NULL)         AS sessions_null_saved_by,
  (SELECT COUNT(*) FROM try_on_sessions WHERE is_hidden IS NULL)        AS sessions_null_is_hidden,
  (SELECT COUNT(*) FROM try_on_sessions WHERE likes IS NULL)            AS sessions_null_likes,
  (SELECT COUNT(*) FROM try_on_sessions WHERE views IS NULL)            AS sessions_null_views;
