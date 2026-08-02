const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const providers = await prisma.productionAIProvider.findMany({
    include: { ProductionProviderCredential: true }
  });
  console.log(JSON.stringify(providers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
