const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setModel() {
  await prisma.productionAIProvider.updateMany({
    where: { name: 'Local FLUX' },
    data: { supported_models: ['black-forest-labs/FLUX.1-schnell'] }
  });
  console.log('Updated model config.');
}
setModel().finally(() => prisma.$disconnect());
