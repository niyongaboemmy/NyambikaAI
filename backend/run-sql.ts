import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

async function runSQL() {
  // Get database connection string from environment variables
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  // Create a new pool
  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Read and execute the SQL file
    const migrationsDir = path.join(process.cwd(), 'migrations');
    const sqlPath = path.join(migrationsDir, '0007_create_payment_settings.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running SQL migration...');
    await pool.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSQL().catch(console.error);
