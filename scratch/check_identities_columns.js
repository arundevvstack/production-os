const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking columns of auth.identities...");

  try {
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'auth' AND table_name = 'identities';
    `);
    
    console.log("✔ auth.identities Columns:");
    console.table(columns);
  } catch (error) {
    console.error("❌ Failed to query columns:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
