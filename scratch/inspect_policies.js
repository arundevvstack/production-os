require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    await client.connect();

    // 1. Get all policies
    const policies = await client.query(`
      SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check 
      FROM pg_policies 
      ORDER BY tablename, policyname;
    `);
    
    console.log('Active RLS Policies in PostgreSQL:');
    policies.rows.forEach(p => {
      console.log(`\nTable: "${p.tablename}" | Policy: "${p.policyname}"`);
      console.log(`  Roles:`, p.roles);
      console.log(`  Command:`, p.cmd);
      console.log(`  Qual (USING):`, p.qual);
      console.log(`  With Check:`, p.with_check);
    });

  } catch (error) {
    console.error('PostgreSQL Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
