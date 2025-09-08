import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { createPool as createMySqlPool } from 'mysql2/promise';
import { drizzle as drizzleMySql } from 'drizzle-orm/mysql2';
import * as schema from "./shared/schema.dialect";

const DIALECT = (process.env.DB_DIALECT || 'postgres').toLowerCase();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export let pool: any;
export let db: any;

if (DIALECT === 'mysql') {
  // mysql2 supports passing a connection URI directly
  pool = createMySqlPool(process.env.DATABASE_URL);
  db = drizzleMySql(pool, { schema: schema as any, mode: 'default' });
} else {
  // default: postgres
  pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  db = drizzlePg(pool, { schema });
}

// Runtime-safe migration to add missing columns without a migration framework
export async function ensureSchemaMigrations() {
  if (DIALECT === 'mysql') {
    // No-op for MySQL in this lightweight helper. Use proper migrations for production.
    return;
  }

  // Ensure orders.validation_status exists (Postgres)
  const checkColSql = `
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'validation_status'
  `;
  const result = await (pool as PgPool).query(checkColSql);
  if (result.rowCount === 0) {
    // Add the column with default 'pending'
    await (pool as PgPool).query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending'`);
  }

  // Ensure products.display_order exists for custom product ordering (Postgres)
  const checkDisplayOrderSql = `
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'display_order'
  `;
  const displayOrderResult = await (pool as PgPool).query(checkDisplayOrderSql);
  if (displayOrderResult.rowCount === 0) {
    await (pool as PgPool).query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS display_order INTEGER`);
    // Helpful index to speed up ordering queries
    await (pool as PgPool).query(`CREATE INDEX IF NOT EXISTS idx_products_display_order ON products (display_order ASC NULLS LAST)`);
  }
}
