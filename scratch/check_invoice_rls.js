const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInvoiceRLS() {
  // Check all policies on Invoice table
  const policies = await prisma.$queryRawUnsafe(`
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies 
    WHERE tablename = 'Invoice' AND schemaname = 'public';
  `);
  
  console.log('\n📋 Invoice table policies:');
  if (policies.length === 0) {
    console.log('   ⚠️  NO POLICIES FOUND — RLS is blocking all operations!');
  } else {
    policies.forEach(p => {
      console.log(`   • ${p.policyname} (${p.cmd})`);
      if (p.qual) console.log(`     USING: ${p.qual}`);
      if (p.with_check) console.log(`     WITH CHECK: ${p.with_check}`);
    });
  }

  // Check if RLS is even enabled
  const rls = await prisma.$queryRawUnsafe(`
    SELECT relname, relrowsecurity 
    FROM pg_class 
    WHERE relname = 'Invoice' AND relnamespace = 'public'::regnamespace;
  `);
  console.log('\n🔐 RLS enabled on Invoice:', rls[0]?.relrowsecurity ? 'YES' : 'NO');

  await prisma.$disconnect();
}

checkInvoiceRLS().catch(console.error);
