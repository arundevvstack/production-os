const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.prospect.updateMany({
    where: { stage: 'lead' },
    data: { stage: 'new_lead' }
  });
  console.log(`Fixed ${result.count} orphaned leads.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
