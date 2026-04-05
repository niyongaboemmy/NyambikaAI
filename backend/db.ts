import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./shared/schema.dialect";
import * as fs from "fs";
import * as path from "path";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// ─────────────────────────────────────────────────────────────────────────────
// Auto-migration runner: tracks applied migrations in `schema_migrations` table
// and applies any pending *.sql files from the migrations/ directory on startup.
// ─────────────────────────────────────────────────────────────────────────────
export async function ensureSchemaMigrations() {
  // 1. Create the migrations tracking table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // 2. Also run the hand-coded column guards (kept for safety)
  await pool.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending'
  `);
  await pool.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS display_order INTEGER
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_products_display_order
      ON products (display_order ASC NULLS LAST)
  `);

  // 3. Discover and apply pending migration files
  const migrationsDir = path.join(
    new URL(".", import.meta.url).pathname,
    "migrations"
  );

  if (!fs.existsSync(migrationsDir)) {
    console.log("[migrations] No migrations directory found — skipping.");
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.log("[migrations] No SQL migration files found.");
    return;
  }

  // 4. Find which files have already been applied
  const { rows: applied } = await pool.query<{ filename: string }>(
    "SELECT filename FROM schema_migrations"
  );
  const appliedSet = new Set(applied.map((r) => r.filename));

  const pending = files.filter((f) => !appliedSet.has(f));

  if (pending.length === 0) {
    console.log("[migrations] All migrations already applied ✓");
    return;
  }

  console.log(
    `[migrations] Applying ${pending.length} pending migration(s)...`
  );

  for (const file of pending) {
    const sqlPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(sqlPath, "utf8");
    console.log(`[migrations] >>> ${file}`);
    try {
      await pool.query(sql);
      await pool.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
        [file]
      );
      console.log(`[migrations] <<< ${file} ✓`);
    } catch (err: any) {
      // Log but continue — migrations should be idempotent (IF NOT EXISTS etc.)
      console.warn(
        `[migrations] !!! ${file} — warning: ${err?.message ?? err}`
      );
    }
  }

  console.log("[migrations] Done ✓");
}
