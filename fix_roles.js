require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // Drop the FK constraint on User.role_id -> Role.id
  // This lets us store role name strings directly like 'SUPER_ADMIN'
  const fks = await client.query(`
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_name='User' AND constraint_type='FOREIGN KEY' AND constraint_name LIKE '%role%';
  `);
  console.log('FK constraints on User.role_id:', fks.rows);

  for (const fk of fks.rows) {
    await client.query(`ALTER TABLE public."User" DROP CONSTRAINT "${fk.constraint_name}";`);
    console.log(`✓ Dropped FK: ${fk.constraint_name}`);
  }

  // Now update all users to use role NAME instead of role ID
  const roleMap = await client.query('SELECT id, name FROM public."Role"');
  const map = {};
  roleMap.rows.forEach(r => map[r.id] = r.name);
  console.log('\nRole map:', map);

  const users = await client.query('SELECT id, email, role_id FROM public."User"');
  for (const u of users.rows) {
    const roleName = map[u.role_id] || 'EMPLOYEE';
    await client.query(`UPDATE public."User" SET role_id = $1 WHERE id = $2`, [roleName, u.id]);
    console.log(`✓ ${u.email}: ${u.role_id} -> ${roleName}`);
  }

  // Also fix the onboarding page insert — it sets role_id = "SUPER_ADMIN" directly, which is correct now
  // Also fix useTenant's self-healing insert — it uses assignedRole = user.user_metadata?.role || 'EMPLOYEE'

  await client.query(`NOTIFY pgrst, 'reload schema';`);
  console.log('\n✓ Cache reloaded');

  // Verify
  const verify = await client.query('SELECT email, role_id, company_id, status FROM public."User"');
  console.log('\n=== FINAL STATE ===');
  verify.rows.forEach(u => console.log(`  ${u.email} | role: ${u.role_id} | company: ${u.company_id} | status: ${u.status}`));

  await client.end();
  console.log('\n✅ Done! Refresh browser.');
}

main().catch(e => console.error(e.message));
