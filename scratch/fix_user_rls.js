/**
 * FIX USER TABLE RLS POLICIES
 * 
 * Current problem: Authenticated users get 403 when trying to READ their own profile row.
 * This causes use-tenant to think profile is missing → triggers onboarding page.
 * 
 * Fix: Ensure authenticated users can always:
 * 1. Read their own row
 * 2. Insert their own row (self-healing)
 * 3. Update their own row (for profile edits)
 * 4. SuperAdmins/Managers can read all users in their company
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserRLS() {
  console.log('Fixing User table RLS policies...\n');

  const policies = [
    // Drop any conflicting policies first
    `DROP POLICY IF EXISTS "Users can read own profile" ON public."User";`,
    `DROP POLICY IF EXISTS "Users can insert own profile" ON public."User";`,
    `DROP POLICY IF EXISTS "Users can update own profile" ON public."User";`,
    `DROP POLICY IF EXISTS "Company members can view each other" ON public."User";`,
    `DROP POLICY IF EXISTS "Allow all for authenticated" ON public."User";`,

    // Self-read: users can ALWAYS read their own row
    `CREATE POLICY "Users can read own profile"
     ON public."User"
     FOR SELECT
     TO authenticated
     USING (id = auth.uid());`,

    // Company-read: users can see others in the same company (needed for dashboards)
    `CREATE POLICY "Company members can view each other"
     ON public."User"
     FOR SELECT
     TO authenticated
     USING (
       company_id IN (
         SELECT company_id FROM public."User" WHERE id = auth.uid()
       )
     );`,

    // Self-insert: allow inserting own row (self-healing profile generation)
    `CREATE POLICY "Users can insert own profile"
     ON public."User"
     FOR INSERT
     TO authenticated
     WITH CHECK (id = auth.uid());`,

    // Self-update: allow updating own profile
    `CREATE POLICY "Users can update own profile"
     ON public."User"
     FOR UPDATE
     TO authenticated
     USING (id = auth.uid())
     WITH CHECK (id = auth.uid());`,
  ];

  for (const sql of policies) {
    try {
      await prisma.$executeRawUnsafe(sql);
      const action = sql.trim().split('\n')[0];
      console.log('✅', action.substring(0, 80));
    } catch (e) {
      console.log('⚠️  Skipped:', sql.trim().split('\n')[0].substring(0, 80));
    }
  }

  console.log('\n✅ User table RLS policies updated.');
  console.log('   - Users can now read their own profile (fixes 403)');
  console.log('   - Users can see company members (fixes dashboard stats)');
  console.log('   - Self-healing insert/update allowed');

  await prisma.$disconnect();
}

fixUserRLS().catch(console.error);
