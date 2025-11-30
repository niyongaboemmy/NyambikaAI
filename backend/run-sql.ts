import { Pool } from "pg";
import { createPool } from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

async function runSQL() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const DIALECT = (process.env.DB_DIALECT || "postgres").toLowerCase();
  let pool: any;

  if (DIALECT === "mysql") {
    pool = createPool(connectionString);
  } else {
    pool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  try {
    const migrationsDir = path.join(process.cwd(), "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.log("No migrations directory found, skipping.");
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    if (files.length === 0) {
      console.log("No .sql migration files found, nothing to do.");
      return;
    }

    console.log(`Found ${files.length} migration file(s). Running in order...`);
    for (const file of files) {
      const sqlPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(sqlPath, "utf8");
      console.log(`\n>>> Running migration: ${file}`);
      try {
        await pool.query(sql);
        console.log(`<<< Completed: ${file}`);
      } catch (err) {
        console.error(`!!! Error in ${file}:`, (err as any)?.message || err);
        // Continue to next migration, assuming idempotency (CREATE IF NOT EXISTS, etc.)
      }
    }
    console.log("\nAll migrations processed.");
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  } finally {
    if (DIALECT === "mysql") {
      await pool.end();
    } else {
      await pool.end();
    }
  }
}

runSQL().catch(console.error);
