const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseAndFix() {
  // 1. Check what get_auth_company_id() does
  try {
    const fn = await prisma.$queryRawUnsafe(`
      SELECT prosrc FROM pg_proc 
      WHERE proname = 'get_auth_company_id';
    `);
    console.log('\n🔍 get_auth_company_id() function body:');
    console.log(fn[0]?.prosrc || '  ⚠️  Function not found!');
  } catch(e) {
    console.log('Could not read function:', e.message);
  }

  // 2. Check ALL tables that use this function
  try {
    const tables = await prisma.$queryRawUnsafe(`
      SELECT tablename, policyname, qual 
      FROM pg_policies 
      WHERE qual LIKE '%get_auth_company_id%' 
      AND schemaname = 'public';
    `);
    console.log('\n📋 Tables using get_auth_company_id():');
    tables.forEach(t => console.log(`   • ${t.tablename}: ${t.policyname}`));
  } catch(e) {
    console.log('Error:', e.message);
  }

  // 3. Drop the old Invoice policy and replace with proper one
  console.log('\n🔧 Fixing Invoice table RLS...');

  const fixes = [
    // Drop the broken function-based policy
    `DROP POLICY IF EXISTS "invoice_tenant_isolation" ON public."Invoice";`,
    
    // Self-read + company read
    `CREATE POLICY dp_invoice_select ON public."Invoice"
     FOR SELECT TO authenticated
     USING (
       company_id IN (
         SELECT u.company_id FROM public."User" u WHERE u.id = auth.uid()::text
       )
     );`,
    
    // INSERT — own company only
    `CREATE POLICY dp_invoice_insert ON public."Invoice"
     FOR INSERT TO authenticated
     WITH CHECK (
       company_id IN (
         SELECT u.company_id FROM public."User" u WHERE u.id = auth.uid()::text
       )
     );`,
    
    // UPDATE — own company invoices
    `CREATE POLICY dp_invoice_update ON public."Invoice"
     FOR UPDATE TO authenticated
     USING (
       company_id IN (
         SELECT u.company_id FROM public."User" u WHERE u.id = auth.uid()::text
       )
     )
     WITH CHECK (
       company_id IN (
         SELECT u.company_id FROM public."User" u WHERE u.id = auth.uid()::text
       )
     );`,

    // DELETE — own company invoices  
    `CREATE POLICY dp_invoice_delete ON public."Invoice"
     FOR DELETE TO authenticated
     USING (
       company_id IN (
         SELECT u.company_id FROM public."User" u WHERE u.id = auth.uid()::text
       )
     );`,
  ];

  for (const sql of fixes) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('✅', sql.trim().split('\n')[0].substring(0, 70));
    } catch(e) {
      console.log('⚠️  Skip:', sql.trim().split('\n')[0].substring(0, 60), '→', e.message.split('\n')[0]);
    }
  }

  // Verify
  const final = await prisma.$queryRawUnsafe(`
    SELECT policyname, cmd FROM pg_policies 
    WHERE tablename = 'Invoice' AND schemaname = 'public';
  `);
  console.log('\n📋 Final Invoice policies:', final.map(p => `${p.policyname} (${p.cmd})`));
  
  await prisma.$disconnect();
  console.log('\n✅ Invoice RLS fixed. DELETE should now work.');
}

diagnoseAndFix().catch(console.error);
