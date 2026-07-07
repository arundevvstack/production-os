const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const wt = await prisma.workflowTemplate.findMany();
  console.log('Templates:', wt);
  const ps = await prisma.projectStage.findMany();
  console.log('Stages:', ps);
  
  // also check if any users exist to see their roles
  const users = await prisma.user.findMany({take: 1});
  console.log('Users:', users);

  await prisma.$disconnect();
}
run();
