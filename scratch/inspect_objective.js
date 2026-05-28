require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    await client.connect();

    // 1. Get all public tables
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' ORDER BY table_name;
    `);
    console.log('Public tables in PostgreSQL:', tables.rows.map(r => r.table_name));

    // 2. Query columns of Objective table if it exists
    const hasObjective = tables.rows.some(r => r.table_name === 'Objective');
    if (hasObjective) {
      const res = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'Objective'
        ORDER BY ordinal_position;
      `);
      console.log('\nObjective columns:', JSON.stringify(res.rows, null, 2));

      // Try running a sample select
      const rows = await client.query('SELECT * FROM public."Objective" LIMIT 1');
      console.log('\nObjective sample query row count:', rows.rows.length);
    } else {
      console.log('\nWARNING: Objective table does NOT exist in PostgreSQL!');
    }

  } catch (error) {
    console.error('PostgreSQL Error:', error.message);
    if (error.hint) console.error('Hint:', error.hint);
    if (error.detail) console.error('Detail:', error.detail);
  } finally {
    await client.end();
  }
}

main();
