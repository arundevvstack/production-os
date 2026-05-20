require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // Check auth.users to see if anyone has logged in
  const authUsers = await client.query('SELECT id, email, raw_user_meta_data FROM auth.users LIMIT 5;');
  console.log('Auth users:');
  authUsers.rows.forEach(u => {
    console.log(`  - ${u.email} (id: ${u.id})`);
    console.log(`    metadata:`, JSON.stringify(u.raw_user_meta_data));
  });

  if (authUsers.rows.length === 0) {
    console.log('  No auth users found!');
    await client.end();
    return;
  }

  // Check if Company table has the updatedAt default now  
  const companyCol = await client.query(`
    SELECT column_name, column_default, is_nullable 
    FROM information_schema.columns 
    WHERE table_name='Company' AND column_name='updatedAt';
  `);
  console.log('\nCompany.updatedAt column:', companyCol.rows);

  // Check if User table exists and has correct columns
  const userCols = await client.query(`
    SELECT column_name, column_default, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='User'
    ORDER BY ordinal_position;
  `);
  console.log('\nUser table columns:');
  userCols.rows.forEach(c => console.log(`  ${c.column_name} (nullable: ${c.is_nullable}, default: ${c.column_default || 'NONE'})`));

  await client.end();
}

main().catch(e => { console.error(e); });
