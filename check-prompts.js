const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const c1 = await prisma.productionPrompt.count();
  const c2 = await prisma.productionPromptVersion.count();
  console.log('Prompts:', c1, 'Versions:', c2);
  
  const v = await prisma.productionPromptVersion.findFirst({ orderBy: { created_at: 'desc' } });
  if (v) console.log('Latest version image prompt:', v.image_prompt);
}
run().finally(() => prisma.$disconnect());
