const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TABLES = ['Prospect', 'Client'];

async function main() {
  console.log('--- Applying CRM Row Level Security Policies ---');

  for (const table of TABLES) {
    console.log(`\nConfiguring RLS for public."${table}"...`);

    // 1. Enable RLS
    await prisma.$executeRawUnsafe(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
    console.log(`  ✓ Enabled RLS`);

    // 2. Drop existing policies
    const policies = await prisma.$queryRawUnsafe(`
      SELECT policyname FROM pg_policies 
      WHERE tablename = '${table}' AND schemaname = 'public';
    `);

    for (const policy of policies) {
      if (policy.policyname.startsWith('dp_') || policy.policyname.includes('tenant_isolation')) {
        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${policy.policyname}" ON public."${table}";`);
        console.log(`  🗑  Dropped policy: ${policy.policyname}`);
      }
    }

    // 3. Create SELECT, INSERT, UPDATE, DELETE policies
    const COMPANY_CONDITION = `company_id = public.get_auth_company_id()`;

    const operations = [
      { cmd: 'SELECT', using: COMPANY_CONDITION, check: null },
      { cmd: 'INSERT', using: null, check: COMPANY_CONDITION },
      { cmd: 'UPDATE', using: COMPANY_CONDITION, check: COMPANY_CONDITION },
      { cmd: 'DELETE', using: COMPANY_CONDITION, check: null },
    ];

    for (const op of operations) {
      const policyName = `dp_${table.toLowerCase()}_${op.cmd.toLowerCase()}`;
      let sql = `CREATE POLICY ${policyName} ON public."${table}" FOR ${op.cmd} TO authenticated `;
      if (op.using) sql += `USING (${op.using}) `;
      if (op.check) sql += `WITH CHECK (${op.check})`;
      sql += ';';

      await prisma.$executeRawUnsafe(sql);
      console.log(`  ✅ Registered policy: ${policyName}`);
    }
  }

  console.log('\n✅ Row Level Security configurations successfully set up.');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error applying RLS policies:', e);
  prisma.$disconnect();
  process.exit(1);
});
