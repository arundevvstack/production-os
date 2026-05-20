const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPending() {
  const users = await prisma.user.findMany({ where: { status: 'pending' } });
  console.log(users);
}

checkPending()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
