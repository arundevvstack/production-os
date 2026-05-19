const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Analyzing Companies and Invoices in database...");

  try {
    const companies = await prisma.company.findMany();
    console.log("\n✔ Companies in Database:");
    console.table(companies.map(c => ({ id: c.id, name: c.name })));

    const invoices = await prisma.invoice.findMany();
    console.log("\n✔ Invoices in Database:");
    console.table(invoices.map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      client_name: inv.client_name,
      company_id: inv.company_id,
      total: inv.total
    })));

  } catch (error) {
    console.error("❌ Failed to query database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
