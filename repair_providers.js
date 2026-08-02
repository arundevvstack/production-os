const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function repairProvider() {
  try {
    // Disable the broken 'Flux' provider that has no credentials
    await prisma.productionAIProvider.updateMany({
      where: { name: 'Flux' },
      data: { is_enabled: false }
    });
    
    // Ensure 'Local FLUX' has 'Image' in supported_asset_types
    const localFlux = await prisma.productionAIProvider.findFirst({
      where: { name: 'Local FLUX' }
    });
    
    if (localFlux) {
      await prisma.productionAIProvider.update({
        where: { id: localFlux.id },
        data: {
          supported_asset_types: ['Image'],
          is_enabled: true
        }
      });
      console.log('Successfully repaired Local FLUX provider config.');
    }
    
    // Ensure 'Local AI' is also correctly configured
    const localAI = await prisma.productionAIProvider.findFirst({
      where: { name: 'Local AI' }
    });
    
    if (localAI) {
      await prisma.productionAIProvider.update({
        where: { id: localAI.id },
        data: {
          supported_asset_types: ['Image'],
          is_enabled: true
        }
      });
      console.log('Successfully repaired Local AI provider config.');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

repairProvider();
