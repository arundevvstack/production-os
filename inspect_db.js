require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    await client.connect();
    
    // Check if RLS is enabled on User table
    const rlsRes = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'User';
    `);
    console.log('RLS Status:', rlsRes.rows);

    // Check grants on schema public
    const schemaRes = await client.query(`
      SELECT nspname, nspacl 
      FROM pg_namespace 
      WHERE nspname = 'public';
    `);
    console.log('Schema Grants:', schemaRes.rows);

    // Check grants on User table
    const tableRes = await client.query(`
      SELECT relname, relacl 
      FROM pg_class 
      WHERE relname = 'User';
    `);
    console.log('Table Grants:', tableRes.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

main();
