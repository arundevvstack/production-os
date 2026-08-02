const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getValidChar() {
  const characters = await prisma.productionCharacter.findMany({
    include: { Project: true }
  });
  
  for (const char of characters) {
    if (char.description || char.gender || char.age || (char.metadata && char.metadata.appearance)) {
      console.log(`Found valid character: ${char.id} - ${char.name}`);
      return;
    }
  }
  console.log('No valid character found.');
}

getValidChar().catch(console.error).finally(() => prisma.$disconnect());
