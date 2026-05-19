const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkForceRls() {
  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT relname, relrowsecurity, relforcerowsecurity 
      FROM pg_class 
      WHERE relname = 'User' AND relnamespace = 'public'::regnamespace;
    `);
    console.log('User RLS settings:');
    console.log(res);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkForceRls();
