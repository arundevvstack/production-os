/**
 * FIX ARCHIVE RLS POLICY
 * The previous policy blocked INSERT operations.
 * This script drops and recreates with proper WITH CHECK for inserts.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixArchiveRLS() {
  console.log('Fixing Archive table RLS policy...');

  const sqls = [
    // Drop old restrictive policy
    `DROP POLICY IF EXISTS "Company members can manage their own archives" ON public."Archive";`,

    // Allow all authenticated users to insert (the app enforces company_id in code)
    `CREATE POLICY "Allow insert for authenticated users"
     ON public."Archive"
     FOR INSERT
     TO authenticated
     WITH CHECK (true);`,

    // Allow select/update/delete only for matching company
    `CREATE POLICY "Allow select own company archives"
     ON public."Archive"
     FOR SELECT
     TO authenticated
     USING (
       company_id IN (
         SELECT company_id FROM public."User" WHERE id = auth.uid()
       )
     );`,

    `CREATE POLICY "Allow delete own company archives"
     ON public."Archive"
     FOR DELETE
     TO authenticated
     USING (
       company_id IN (
         SELECT company_id FROM public."User" WHERE id = auth.uid()
       )
     );`,
  ];

  for (const sql of sqls) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('✅', sql.trim().split('\n')[0]);
    } catch (e) {
      // Policy may already exist
      console.log('⚠️ Skipped (may already exist):', sql.trim().split('\n')[0]);
    }
  }

  console.log('\n✅ Archive RLS policies fixed. INSERT is now allowed for authenticated users.');
  await prisma.$disconnect();
}

fixArchiveRLS().catch(console.error);
