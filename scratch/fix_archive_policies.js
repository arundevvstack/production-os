const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixArchivePolicies() {
  const policies = [
    `CREATE POLICY dp_archive_select ON public."Archive" 
     FOR SELECT TO authenticated 
     USING (company_id IN (
       SELECT u.company_id FROM public."User" u WHERE u.id = auth.uid()::text
     ));`,
    `CREATE POLICY dp_archive_delete ON public."Archive" 
     FOR DELETE TO authenticated 
     USING (company_id IN (
       SELECT u.company_id FROM public."User" u WHERE u.id = auth.uid()::text
     ));`,
  ];

  for (const sql of policies) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('✅', sql.trim().split('\n')[0]);
    } catch(e) {
      console.log('⚠️  Skip (may exist):', e.message.split('\n')[0]);
    }
  }

  const final = await prisma.$queryRawUnsafe(`
    SELECT policyname, cmd FROM pg_policies 
    WHERE tablename = 'Archive' AND schemaname = 'public';
  `);
  console.log('\n📋 Final Archive policies:', final.map(p => `${p.policyname} (${p.cmd})`));
  await prisma.$disconnect();
}

fixArchivePolicies().catch(console.error);
