require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    await client.connect();

    // Get all column names for the Prospect table
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'Prospect'
      ORDER BY ordinal_position;
    `);
    console.log('Prospect columns:', JSON.stringify(res.rows, null, 2));

    // Get all tables in public schema
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name;
    `);
    console.log('\nAll public tables:', tables.rows.map(r => r.table_name));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

main();
