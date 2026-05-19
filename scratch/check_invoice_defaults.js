const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Inspecting column default values for public.Invoice...");

  try {
    const defaults = await prisma.$queryRawUnsafe(`
      SELECT column_name, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'Invoice'
      ORDER BY ordinal_position;
    `);
    
    console.log("✔ Columns, Defaults, and Nullability:");
    console.table(defaults);
  } catch (error) {
    console.error("❌ Failed to query columns:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
