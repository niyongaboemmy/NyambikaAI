import { Pool } from 'pg';
import 'dotenv/config';

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    return;
  }

  console.log('Testing connection to database...');
  console.log('Connection string (with password hidden):', 
    connectionString.replace(/:[^:]*@/, ':***@'));

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000, // 5 seconds timeout
  });

  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database!');
    
    // Test query
    const result = await client.query('SELECT version()');
    console.log('Database version:', result.rows[0].version);
    
    // Check if payment_settings table exists
    const tableExists = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'payment_settings'
      )`
    );
    
    console.log('payment_settings table exists:', tableExists.rows[0].exists);
    
    client.release();
  } catch (error) {
    console.error('Connection error:', error);
  } finally {
    await pool.end();
  }
}

testConnection().catch(console.error);
