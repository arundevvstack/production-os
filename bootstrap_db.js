require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  
  console.log('=== SEEDING ROLES & USERS ===\n');

  const companyRes = await client.query('SELECT id FROM public."Company" LIMIT 1');
  const companyId = companyRes.rows[0]?.id;
  console.log('Company ID:', companyId);

  // 1. Seed Roles
  const roles = [
    { name: 'SUPER_ADMIN', permissions: ['*'] },
    { name: 'ADMIN', permissions: ['dashboard','projects','crm','finance','talents','proposals','clients','invoices','reports','settings'] },
    { name: 'MANAGER', permissions: ['dashboard','projects','crm','talents','proposals'] },
    { name: 'EMPLOYEE', permissions: ['dashboard','projects','talents'] },
    { name: 'ACCOUNTS', permissions: ['dashboard','finance','invoices','reports'] },
    { name: 'MARKETING_SALES', permissions: ['dashboard','crm','proposals','talents'] },
    { name: 'CLIENT', permissions: ['dashboard'] },
    { name: 'TALENT', permissions: ['dashboard'] },
  ];

  const roleIdMap = {};
  for (const role of roles) {
    const res = await client.query(`
      INSERT INTO public."Role" (id, name, permissions)
      VALUES (gen_random_uuid()::text, $1, $2::text[])
      ON CONFLICT DO NOTHING
      RETURNING id;
    `, [role.name, role.permissions]);
    
    if (res.rows.length > 0) {
      roleIdMap[role.name] = res.rows[0].id;
      console.log(`✓ Role: ${role.name} -> ${res.rows[0].id}`);
    } else {
      // Already exists, find it
      const existing = await client.query(`SELECT id FROM public."Role" WHERE name = $1`, [role.name]);
      if (existing.rows.length > 0) {
        roleIdMap[role.name] = existing.rows[0].id;
        console.log(`- Role exists: ${role.name} -> ${existing.rows[0].id}`);
      }
    }
  }

  // 2. Create User profiles using role IDs
  const authUsers = await client.query('SELECT id, email, raw_user_meta_data FROM auth.users');
  
  for (const au of authUsers.rows) {
    const meta = au.raw_user_meta_data || {};
    const fullName = meta.full_name || au.email.split('@')[0] || 'Unknown User';
    const isSuperAdmin = au.email === 'arundevv.com@gmail.com';
    
    const roleName = isSuperAdmin ? 'SUPER_ADMIN' : (meta.role || 'EMPLOYEE');
    const roleId = roleIdMap[roleName] || roleIdMap['EMPLOYEE'];
    
    await client.query(`
      INSERT INTO public."User" (id, email, "fullName", company_id, role_id, status, department, onboarding_status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET 
        company_id = EXCLUDED.company_id,
        role_id = EXCLUDED.role_id,
        status = EXCLUDED.status;
    `, [
      au.id,
      au.email,
      fullName,
      companyId,
      roleId,
      'approved',
      isSuperAdmin ? 'Administration' : 'Production',
      'completed'
    ]);
    console.log(`✓ User: ${au.email} (role: ${roleName} -> ${roleId})`);
  }

  // 3. Create SuperAdmin entry
  await client.query(`
    INSERT INTO public."SuperAdmin" (id, email, "createdAt")
    VALUES ('77f2603b-a1a5-459d-bf95-c07d905be9fc', 'arundevv.com@gmail.com', NOW())
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log('✓ SuperAdmin entry');

  // 4. Reload cache
  await client.query(`NOTIFY pgrst, 'reload schema';`);

  // Verify
  const users = await client.query('SELECT email, role_id, status, company_id FROM public."User"');
  console.log('\n=== USERS ===');
  users.rows.forEach(u => console.log(`  ${u.email} | role: ${u.role_id} | status: ${u.status} | company: ${u.company_id}`));

  await client.end();
  console.log('\n✅ Done! Refresh your browser.');
}

main().catch(e => { console.error('Error:', e.message); });
