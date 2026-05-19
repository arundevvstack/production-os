const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showFunctionDef() {
  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT pg_get_functiondef(p.oid) AS def
      FROM pg_proc p
      WHERE p.proname = 'get_auth_company_id';
    `);
    console.log('Function Definition:');
    console.log(res[0]?.def);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showFunctionDef();
