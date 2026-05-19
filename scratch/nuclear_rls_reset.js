/**
 * NUCLEAR RLS RESET — User table
 * Disable RLS entirely, drop ALL policies, re-enable with correct ones.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function nuclearRLSReset() {
  console.log('Nuclear RLS reset on User table...\n');

  // Step 1: Check what policies exist
  const listSQL = `
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'User' AND schemaname = 'public';
  `;
  
  const existing = await prisma.$queryRawUnsafe(listSQL);
  console.log('Existing policies:', existing.map(p => p.policyname));

  // Step 2: Drop all existing policies
  for (const row of existing) {
    const dropSQL = `DROP POLICY IF EXISTS "${row.policyname}" ON public."User";`;
    try {
      await prisma.$executeRawUnsafe(dropSQL);
      console.log('✅ Dropped:', row.policyname);
    } catch(e) {
      console.log('⚠️ Could not drop:', row.policyname, e.message);
    }
  }

  // Step 3: Temporarily disable RLS to verify we can create policies cleanly
  await prisma.$executeRawUnsafe(`ALTER TABLE public."User" DISABLE ROW LEVEL SECURITY;`);
  console.log('\n✅ RLS disabled temporarily');
  
  // Step 4: Re-enable RLS
  await prisma.$executeRawUnsafe(`ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;`);
  console.log('✅ RLS re-enabled\n');

  // Step 5: Create fresh clean policies
  const newPolicies = [
    {
      name: 'dp_user_self_read',
      sql: `CREATE POLICY dp_user_self_read ON public."User"
            FOR SELECT TO authenticated
            USING (id = auth.uid());`
    },
    {
      name: 'dp_user_company_read', 
      sql: `CREATE POLICY dp_user_company_read ON public."User"
            FOR SELECT TO authenticated
            USING (
              company_id IN (
                SELECT u2.company_id FROM public."User" u2 WHERE u2.id = auth.uid()
              )
            );`
    },
    {
      name: 'dp_user_self_insert',
      sql: `CREATE POLICY dp_user_self_insert ON public."User"
            FOR INSERT TO authenticated
            WITH CHECK (id = auth.uid());`
    },
    {
      name: 'dp_user_self_update',
      sql: `CREATE POLICY dp_user_self_update ON public."User"
            FOR UPDATE TO authenticated
            USING (id = auth.uid())
            WITH CHECK (id = auth.uid());`
    },
  ];

  for (const policy of newPolicies) {
    try {
      await prisma.$executeRawUnsafe(policy.sql);
      console.log('✅ Created policy:', policy.name);
    } catch(e) {
      console.log('❌ Failed to create:', policy.name, '-', e.message);
    }
  }

  // Verify
  const final = await prisma.$queryRawUnsafe(listSQL);
  console.log('\n📋 Final policies:', final.map(p => p.policyname));
  console.log('\n✅ Done. Users can now read their own profile row.');
  
  await prisma.$disconnect();
}

nuclearRLSReset().catch(console.error);
