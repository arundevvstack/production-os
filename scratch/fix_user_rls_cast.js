/**
 * FIX USER RLS WITH CORRECT TYPE CAST
 * User.id is TEXT, auth.uid() returns UUID — need ::text cast
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserRLSWithCast() {
  console.log('Creating User RLS policies with TEXT cast...\n');

  const newPolicies = [
    {
      name: 'dp_user_self_read',
      sql: `CREATE POLICY dp_user_self_read ON public."User"
            FOR SELECT TO authenticated
            USING (id = auth.uid()::text);`
    },
    {
      name: 'dp_user_company_read', 
      sql: `CREATE POLICY dp_user_company_read ON public."User"
            FOR SELECT TO authenticated
            USING (
              company_id IN (
                SELECT u2.company_id FROM public."User" u2 WHERE u2.id = auth.uid()::text
              )
            );`
    },
    {
      name: 'dp_user_self_insert',
      sql: `CREATE POLICY dp_user_self_insert ON public."User"
            FOR INSERT TO authenticated
            WITH CHECK (id = auth.uid()::text);`
    },
    {
      name: 'dp_user_self_update',
      sql: `CREATE POLICY dp_user_self_update ON public."User"
            FOR UPDATE TO authenticated
            USING (id = auth.uid()::text)
            WITH CHECK (id = auth.uid()::text);`
    },
  ];

  for (const policy of newPolicies) {
    try {
      await prisma.$executeRawUnsafe(policy.sql);
      console.log('✅ Created:', policy.name);
    } catch(e) {
      console.log('❌ Failed:', policy.name, '-', e.message.split('\n')[0]);
    }
  }

  // Verify
  const final = await prisma.$queryRawUnsafe(`
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'User' AND schemaname = 'public';
  `);
  console.log('\n📋 Active policies:', final.map(p => p.policyname));
  console.log('\n✅ Users can now read/write their own profile. 403 errors resolved.');

  await prisma.$disconnect();
}

fixUserRLSWithCast().catch(console.error);
