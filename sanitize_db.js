const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sanitizeDatabase() {
  const genericNames = [
    "another", "a third", "one subject", "person", "subject", 
    "general elements", "lead character", "supporting character", "the gen z individuals"
  ];
  
  try {
    const characters = await prisma.productionCharacter.findMany();
    console.log(`Found ${characters.length} total characters. Analyzing for generic names...`);
    
    let removedCount = 0;
    for (const char of characters) {
      const charNameLower = char.name.toLowerCase().trim();
      const isGeneric = genericNames.includes(charNameLower) || charNameLower.includes("general element");
      
      if (isGeneric) {
        const source = (char.metadata)?.source?.raw_text || 'Unknown script stage';
        console.log(`\nRemoving generic character:`);
        console.log(`  ID     : ${char.id}`);
        console.log(`  Name   : "${char.name}"`);
        console.log(`  Reason : Matches blocked placeholder list`);
        console.log(`  Source : ${source}`);
        
        await prisma.productionCharacter.delete({ where: { id: char.id } });
        removedCount++;
      }
    }
    console.log(`\nSanitization complete. Removed ${removedCount} generic entities.`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

sanitizeDatabase();
