const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Listing all tables in the public schema of your database...");

  try {
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log("✔ Physical Tables in Database:");
    console.table(tables);
  } catch (error) {
    console.error("❌ Failed to query tables:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
