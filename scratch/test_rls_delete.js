const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRlsDelete() {
  const userId = 'be4467f8-d286-4386-a43a-8591af4ecc44'; // marketing.defineperspective@gmail.com
  const invoiceId = '1206b084-97d6-4ab4-9c2a-c9088c8cb488';

  try {
    console.log(`Simulating delete for user ${userId} and invoice ${invoiceId}...`);
    
    await prisma.$transaction(async (tx) => {
      // Set the claim sub and role
      await tx.$executeRawUnsafe(`
        SELECT set_config('request.jwt.claims', JSON_BUILD_OBJECT('sub', '${userId}')::text, true);
      `);
      await tx.$executeRawUnsafe(`
        SET LOCAL role = 'authenticated';
      `);
      
      // Attempt delete
      const result = await tx.$executeRawUnsafe(`
        DELETE FROM public."Invoice" WHERE id = '${invoiceId}';
      `);
      
      console.log('Result of DELETE query:', result);
      
      // Rollback automatically by throwing error to keep database intact
      throw new Error('ROLLBACK_INTENDED');
    });
  } catch (error) {
    if (error.message === 'ROLLBACK_INTENDED') {
      console.log('✅ Simulating DELETE succeeded (transaction rolled back safely).');
    } else {
      console.error('❌ Simulating DELETE failed:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testRlsDelete();
