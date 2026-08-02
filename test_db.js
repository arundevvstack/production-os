const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); async function main() { 
  const s = await prisma.productionScript.findFirst({
    where: { id: 'f88d3233-bbbf-43c0-a2c2-6664e5b72400' }
  });
  console.log('Script exists?', !!s);
  
  const project = await prisma.project.findUnique({
    where: { id: s.project_id },
    include: {
      ProductionScript: {
        include: {
          Characters: true,
          Locations: true,
          Props: true
        }
      }
    }
  });
  console.log("Project Script Chars length:", project.ProductionScript.Characters.length);
} main();
