const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testWithoutUserCompanyPolicy() {
  const userId = 'be4467f8-d286-4386-a43a-8591af4ecc44'; // marketing.defineperspective@gmail.com
  const invoiceId = '1206b084-97d6-4ab4-9c2a-c9088c8cb488';

  try {
    console.log('🗑 Dropping dp_user_company_read temporarily to test...');
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS dp_user_company_read ON public."User";`);

    console.log('Simulating delete...');
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
      console.log('✅ DELETE succeeded when dp_user_company_read is disabled!');
    } else {
      console.error('❌ Simulating DELETE failed:', error.message);
    }
  } finally {
    // Restore User company read policy but make it non-recursive!
    // Non-recursive policy: check if company_id matches the company_id returned by get_auth_company_id()!
    try {
      console.log('🔧 Restoring dp_user_company_read as non-recursive...');
      await prisma.$executeRawUnsafe(`
        CREATE POLICY dp_user_company_read ON public."User"
        FOR SELECT TO authenticated
        USING (company_id = get_auth_company_id());
      `);
      console.log('✅ Done restoring.');
    } catch(e) {
      console.error('Error restoring:', e.message);
    }
    await prisma.$disconnect();
  }
}

testWithoutUserCompanyPolicy();
