const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRoles() {
  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT rolname, rolsuper, rolbypassrls 
      FROM pg_roles 
      WHERE rolname IN ('postgres', 'authenticated', 'anon', 'service_role');
    `);
    console.log('Roles Attributes:');
    console.log(res);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();
