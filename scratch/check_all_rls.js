const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching all active RLS policies in the public schema...");

  try {
    const policies = await prisma.$queryRawUnsafe(`
      SELECT 
        tablename, 
        policyname, 
        permissive, 
        roles, 
        cmd, 
        qual, 
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);
    
    console.log("\n✔ All Active RLS Policies:");
    console.table(policies);
  } catch (error) {
    console.error("❌ Failed to query RLS policies:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
