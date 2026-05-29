const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany();
  if (companies.length > 0) {
    const c = companies[0];
    await prisma.companySettings.upsert({
      where: { company_id: c.id },
      update: {
        modules_enabled: ['dashboard', 'projects', 'talents', 'crm', 'proposals', 'invoices', 'accounts', 'research', 'reports']
      },
      create: {
        company_id: c.id,
        modules_enabled: ['dashboard', 'projects', 'talents', 'crm', 'proposals', 'invoices', 'accounts', 'research', 'reports']
      }
    });
    console.log('Modules activated for', c.id);
  } else {
    console.log('No company found');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
