const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupBankAccountRLS() {
  console.log('🔧 Setting up RLS on BankAccount table...');
  try {
    // Enable RLS
    await prisma.$executeRawUnsafe(`ALTER TABLE public."BankAccount" ENABLE ROW LEVEL SECURITY;`);
    console.log('  ✅ Enabled RLS on BankAccount');

    // Drop any existing policies
    const policies = ['dp_bankaccount_select', 'dp_bankaccount_insert', 'dp_bankaccount_update', 'dp_bankaccount_delete'];
    for (const name of policies) {
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${name}" ON public."BankAccount";`);
    }

    // Create policies
    const checkCondition = `company_id = get_auth_company_id()`;
    
    await prisma.$executeRawUnsafe(`
      CREATE POLICY dp_bankaccount_select ON public."BankAccount" FOR SELECT TO authenticated USING (${checkCondition});
    `);
    console.log('  ✅ Created SELECT policy');

    await prisma.$executeRawUnsafe(`
      CREATE POLICY dp_bankaccount_insert ON public."BankAccount" FOR INSERT TO authenticated WITH CHECK (${checkCondition});
    `);
    console.log('  ✅ Created INSERT policy');

    await prisma.$executeRawUnsafe(`
      CREATE POLICY dp_bankaccount_update ON public."BankAccount" FOR UPDATE TO authenticated USING (${checkCondition}) WITH CHECK (${checkCondition});
    `);
    console.log('  ✅ Created UPDATE policy');

    await prisma.$executeRawUnsafe(`
      CREATE POLICY dp_bankaccount_delete ON public."BankAccount" FOR DELETE TO authenticated USING (${checkCondition});
    `);
    console.log('  ✅ Created DELETE policy');

    console.log('🎉 RLS configuration complete for BankAccount.');
  } catch (error) {
    console.error('Error setup BankAccount RLS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupBankAccountRLS();
