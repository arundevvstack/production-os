const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInvoices() {
  try {
    const invoices = await prisma.invoice.findMany({
      take: 5,
      select: {
        id: true,
        invoice_number: true,
        company_id: true,
        total: true
      }
    });
    console.log('Invoices in Database:');
    console.log(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInvoices();
