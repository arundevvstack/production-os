const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching column metadata from PostgreSQL for public.User table...");

  try {
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'User';
    `);
    
    console.log("✔ Column Metadata:");
    console.table(columns);
  } catch (error) {
    console.error("❌ Failed to query columns:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
