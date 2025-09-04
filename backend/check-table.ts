import { Pool } from 'pg';
import 'dotenv/config';

async function describeTable() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Get table structure
    const result = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default,
        character_maximum_length
      FROM 
        information_schema.columns 
      WHERE 
        table_name = 'payment_settings'
      ORDER BY 
        ordinal_position;
    `);

    console.log('Table: payment_settings');
    console.table(result.rows);

    // Get constraints
    const constraints = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE 
        tc.table_name = 'payment_settings';
    `);

    console.log('\nConstraints:');
    console.table(constraints.rows);

    // Show sample data
    const data = await pool.query('SELECT * FROM payment_settings;');
    console.log('\nSample Data:');
    console.table(data.rows);

  } catch (error) {
    console.error('Error describing table:', error);
  } finally {
    await pool.end();
  }
}

describeTable().catch(console.error);
