const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Analyzing Row Level Security (RLS) policies on public.Invoice...");

  try {
    const policies = await prisma.$queryRawUnsafe(`
      SELECT 
        tablename, 
        policyname, 
        roles, 
        cmd, 
        qual::text, 
        with_check::text
      FROM pg_policies
      WHERE tablename = 'Invoice';
    `);
    
    console.log("✔ Row Level Security Policies on Invoice:");
    console.table(policies);
  } catch (error) {
    console.error("❌ Failed to query RLS policies:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
