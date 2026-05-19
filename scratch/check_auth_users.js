const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAuthUsers() {
  try {
    const authUsers = await prisma.$queryRawUnsafe(`
      SELECT id, email, raw_user_meta_data 
      FROM auth.users 
      LIMIT 5;
    `);
    console.log('Auth Users:');
    console.log(authUsers);
  } catch (error) {
    console.error('Error fetching auth users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuthUsers();
