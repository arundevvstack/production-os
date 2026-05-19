const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Auditing Company IDs of Leads and Projects...");

  try {
    const leads = await prisma.lead.findMany();
    console.log("\n✔ Leads and their bound Company IDs:");
    console.table(leads.map(l => ({ 
      id: l.id, 
      company_name: l.company_name, 
      company_id: l.company_id 
    })));

    const projects = await prisma.project.findMany();
    console.log("\n✔ Projects and their bound Company IDs:");
    console.table(projects.map(p => ({ 
      id: p.id, 
      project_name: p.project_name, 
      company_id: p.company_id 
    })));

  } catch (error) {
    console.error("❌ Failed to query database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
