const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWithFunction() {
  const userId = 'be4467f8-d286-4386-a43a-8591af4ecc44'; // marketing.defineperspective@gmail.com
  const invoiceId = '1206b084-97d6-4ab4-9c2a-c9088c8cb488';

  try {
    console.log('🔧 Updating Invoice delete policy to use get_auth_company_id()...');
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS dp_invoice_delete ON public."Invoice";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY dp_invoice_delete ON public."Invoice"
      FOR DELETE TO authenticated
      USING (company_id = get_auth_company_id());
    `);

    console.log('Simulating delete with updated policy...');
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`
        SELECT set_config('request.jwt.claims', JSON_BUILD_OBJECT('sub', '${userId}')::text, true);
      `);
      await tx.$executeRawUnsafe(`
        SET LOCAL role = 'authenticated';
      `);
      
      const result = await tx.$executeRawUnsafe(`
        DELETE FROM public."Invoice" WHERE id = '${invoiceId}';
      `);
      console.log('Result of DELETE query:', result);
      throw new Error('ROLLBACK_INTENDED');
    });

  } catch (error) {
    if (error.message === 'ROLLBACK_INTENDED') {
      console.log('✅ DELETE succeeded without recursion!');
    } else {
      console.error('❌ Simulating DELETE failed:', error.message);
    }
  } finally {
    // Re-create the SELECT, INSERT, UPDATE policies on Invoice as well to use the function to prevent recursion there too!
    try {
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS dp_invoice_select ON public."Invoice";`);
      await prisma.$executeRawUnsafe(`
        CREATE POLICY dp_invoice_select ON public."Invoice"
        FOR SELECT TO authenticated
        USING (company_id = get_auth_company_id());
      `);

      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS dp_invoice_insert ON public."Invoice";`);
      await prisma.$executeRawUnsafe(`
        CREATE POLICY dp_invoice_insert ON public."Invoice"
        FOR INSERT TO authenticated
        WITH CHECK (company_id = get_auth_company_id());
      `);

      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS dp_invoice_update ON public."Invoice";`);
      await prisma.$executeRawUnsafe(`
        CREATE POLICY dp_invoice_update ON public."Invoice"
        FOR UPDATE TO authenticated
        USING (company_id = get_auth_company_id())
        WITH CHECK (company_id = get_auth_company_id());
      `);
      console.log('✅ Successfully updated all Invoice policies to use get_auth_company_id()');
    } catch(e) {
      console.error('Error restoring policies:', e.message);
    }
    await prisma.$disconnect();
  }
}

testWithFunction();
