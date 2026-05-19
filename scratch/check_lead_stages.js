const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Analyzing Leads and their stages in the database...");

  try {
    const leads = await prisma.lead.findMany();
    console.log("\n✔ Leads Database Records:");
    console.table(leads.map(l => ({ 
      id: l.id, 
      company_name: l.company_name, 
      stage: l.stage,
      company_id: l.company_id 
    })));

  } catch (error) {
    console.error("❌ Failed to query database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
