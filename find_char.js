const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getChar() {
  const char = await prisma.productionCharacter.findFirst({
    where: { name: { not: 'General Elements' } },
    include: { Project: true }
  });
  console.log(JSON.stringify(char, null, 2));
}

getChar().catch(console.error).finally(() => prisma.$disconnect());
