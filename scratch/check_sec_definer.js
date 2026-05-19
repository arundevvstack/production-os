const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFunctionDefiner() {
  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT proname, prosecdef 
      FROM pg_proc 
      WHERE proname = 'get_auth_company_id';
    `);
    console.log('Function Security Definer Status:');
    console.log(res);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFunctionDefiner();
