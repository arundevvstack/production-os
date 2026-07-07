const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Clearing invalid provider credentials...");
  const deleted = await prisma.productionProviderCredential.deleteMany({});
  console.log(`Deleted ${deleted.count} invalid credentials.`);
  await prisma.$disconnect();
}
run();
