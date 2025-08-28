import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "./shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Runtime-safe migration to add missing columns without a migration framework
export async function ensureSchemaMigrations() {
  // Ensure orders.validation_status exists
  const checkColSql = `
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'validation_status'
  `;
  const result = await pool.query(checkColSql);
  if (result.rowCount === 0) {
    // Add the column with default 'pending'
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending'`);
  }
}
