-- ============================================================
-- migrate-db.sql
-- Updates all image URL columns in the database from:
--   /api/uploads/<filename>   OR   /uploads/<filename>
-- to the dedicated file-server URL:
--   https://files.nyambika.com/files/<filename>   (production)
--   http://localhost:3004/files/<filename>          (local dev)
--
-- USAGE
-- ─────
-- Local dev:
--   psql postgresql://localhost:5432/nyambika -f migrate-db.sql
--
-- Production (Render / Neon):
--   export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
--   psql $DATABASE_URL -f migrate-db.sql
--
-- Or from the root of the project:
--   npm run db:migrate-paths          (reads DATABASE_URL from env)
--
-- BEFORE RUNNING ON PRODUCTION
-- ─────────────────────────────
-- Update the `file_server_base` variable below to your real
-- production file-server domain, e.g:
--   TEXT := 'https://files.nyambika.com';
-- or
--   TEXT := 'https://nyambikav2.vms.rw';
-- ============================================================

DO $$
DECLARE
  -- ★ Change this to your production file-server URL before running in prod
  file_server_base TEXT := 'http://localhost:3004';
BEGIN

  RAISE NOTICE '=== Nyambika DB Image Path Migration ===';
  RAISE NOTICE 'File server base: %', file_server_base;

  -- ── products.image_url ──────────────────────────────────────
  UPDATE products
  SET image_url = file_server_base || '/files/' ||
      regexp_replace(image_url, '^(/api)?/uploads/', '')
  WHERE image_url IS NOT NULL
    AND (image_url LIKE '/uploads/%' OR image_url LIKE '/api/uploads/%');

  RAISE NOTICE 'products.image_url updated: % rows', (SELECT COUNT(*) FROM products WHERE image_url LIKE file_server_base || '%');

  -- ── products.additional_images (text[]) ─────────────────────
  UPDATE products
  SET additional_images = ARRAY(
    SELECT CASE
      WHEN elem LIKE '/uploads/%' OR elem LIKE '/api/uploads/%'
        THEN file_server_base || '/files/' || regexp_replace(elem, '^(/api)?/uploads/', '')
      ELSE elem
    END
    FROM unnest(additional_images) AS elem
  )
  WHERE additional_images IS NOT NULL
    AND additional_images::text LIKE '%/uploads/%';

  -- ── categories.image_url ────────────────────────────────────
  UPDATE categories
  SET image_url = file_server_base || '/files/' ||
      regexp_replace(image_url, '^(/api)?/uploads/', '')
  WHERE image_url IS NOT NULL
    AND (image_url LIKE '/uploads/%' OR image_url LIKE '/api/uploads/%');

  -- ── users.profile_image ────────────────────────────────────
  UPDATE users
  SET profile_image = file_server_base || '/files/' ||
      regexp_replace(profile_image, '^(/api)?/uploads/', '')
  WHERE profile_image IS NOT NULL
    AND (profile_image LIKE '/uploads/%' OR profile_image LIKE '/api/uploads/%');

  -- ── companies.logo_url ────────────────────────────────────
  UPDATE companies
  SET logo_url = file_server_base || '/files/' ||
      regexp_replace(logo_url, '^(/api)?/uploads/', '')
  WHERE logo_url IS NOT NULL
    AND (logo_url LIKE '/uploads/%' OR logo_url LIKE '/api/uploads/%');

  -- ── try_on_sessions.customer_image_url ──────────────────────
  UPDATE try_on_sessions
  SET customer_image_url = file_server_base || '/files/' ||
      regexp_replace(customer_image_url, '^(/api)?/uploads/', '')
  WHERE customer_image_url IS NOT NULL
    AND (customer_image_url LIKE '/uploads/%' OR customer_image_url LIKE '/api/uploads/%');

  -- ── try_on_sessions.try_on_image_url ────────────────────────
  UPDATE try_on_sessions
  SET try_on_image_url = file_server_base || '/files/' ||
      regexp_replace(try_on_image_url, '^(/api)?/uploads/', '')
  WHERE try_on_image_url IS NOT NULL
    AND (try_on_image_url LIKE '/uploads/%' OR try_on_image_url LIKE '/api/uploads/%');

  -- ── outfit_collections.cover_image_url ──────────────────────
  UPDATE outfit_collections
  SET cover_image_url = file_server_base || '/files/' ||
      regexp_replace(cover_image_url, '^(/api)?/uploads/', '')
  WHERE cover_image_url IS NOT NULL
    AND (cover_image_url LIKE '/uploads/%' OR cover_image_url LIKE '/api/uploads/%');

  -- ── reviews.images (text[]) ──────────────────────────────────
  UPDATE reviews
  SET images = ARRAY(
    SELECT CASE
      WHEN elem LIKE '/uploads/%' OR elem LIKE '/api/uploads/%'
        THEN file_server_base || '/files/' || regexp_replace(elem, '^(/api)?/uploads/', '')
      ELSE elem
    END
    FROM unnest(images) AS elem
  )
  WHERE images IS NOT NULL
    AND images::text LIKE '%/uploads/%';

  -- ── orders.size_evidence_images (text[]) ────────────────────
  UPDATE orders
  SET size_evidence_images = ARRAY(
    SELECT CASE
      WHEN elem LIKE '/uploads/%' OR elem LIKE '/api/uploads/%'
        THEN file_server_base || '/files/' || regexp_replace(elem, '^(/api)?/uploads/', '')
      ELSE elem
    END
    FROM unnest(size_evidence_images) AS elem
  )
  WHERE size_evidence_images IS NOT NULL
    AND size_evidence_images::text LIKE '%/uploads/%';

  RAISE NOTICE '=== Migration complete ===';

END $$;
