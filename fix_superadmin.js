require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // Check SuperAdmin columns
  const cols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='SuperAdmin'`);
  console.log('SuperAdmin cols:', cols.rows.map(r => r.column_name));

  // Insert SuperAdmin
  await client.query(`INSERT INTO public."SuperAdmin" (id, email) VALUES ('77f2603b-a1a5-459d-bf95-c07d905be9fc', 'arundevv.com@gmail.com') ON CONFLICT (id) DO NOTHING;`);
  console.log('✓ SuperAdmin created');

  // Now the critical problem: useTenant expects role_id to be a string like 'SUPER_ADMIN',
  // but it's now a UUID FK to Role table. We need to check how useTenant uses it.
  
  // Check current user data
  const users = await client.query('SELECT id, email, role_id FROM public."User"');
  console.log('\nUsers with role_id:');
  users.rows.forEach(u => console.log(`  ${u.email}: role_id = ${u.role_id}`));

  // Check roles
  const roles = await client.query('SELECT id, name FROM public."Role"');
  console.log('\nRoles:');
  roles.rows.forEach(r => console.log(`  ${r.id} -> ${r.name}`));

  await client.query(`NOTIFY pgrst, 'reload schema';`);
  console.log('\n✓ Cache reloaded');

  await client.end();
}

main().catch(e => console.error(e.message));
