const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Analyzing Leads and Projects in database...");

  try {
    const leads = await prisma.lead.findMany();
    console.log(`\n✔ Leads in Database (${leads.length}):`);
    console.table(leads.map(l => ({ id: l.id, company_name: l.company_name, email: l.email })));

    const projects = await prisma.project.findMany();
    console.log(`\n✔ Projects in Database (${projects.length}):`);
    console.table(projects.map(p => ({ id: p.id, project_name: p.project_name, client_name: p.client_name })));

  } catch (error) {
    console.error("❌ Failed to query data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
