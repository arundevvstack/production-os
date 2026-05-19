const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Inspecting all columns and types for public.Invoice...");

  try {
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'Invoice'
      ORDER BY ordinal_position;
    `);
    
    console.log("✔ Physical Columns in Invoice Table:");
    console.table(columns);
  } catch (error) {
    console.error("❌ Failed to query columns:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
