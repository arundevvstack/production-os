const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres:NewTarget@2026@db.dgskurtkixchdfhahzje.supabase.co:5432/postgres"
  });

  await client.connect();
  
  // Check privileges on the Objective table
  const privRes = await client.query(`
    SELECT grantee, privilege_type 
    FROM information_schema.role_table_grants 
    WHERE table_name = 'Objective';
  `);
  console.log("Privileges for Objective:");
  console.log(privRes.rows);

  await client.end();
}

main().catch(console.error);
