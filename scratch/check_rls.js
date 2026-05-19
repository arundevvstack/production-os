const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Auditing PostgreSQL RLS policies and helper functions...");

  try {
    // 1. Get RLS policies on User table
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
      WHERE schemaname = 'public' AND tablename = 'User';
    `);
    console.log("\n✔ Active RLS Policies on public.User:");
    console.table(policies);

    // 2. Get the SQL definition of get_auth_company_id function
    const functionDef = await prisma.$queryRawUnsafe(`
      SELECT pg_get_functiondef(p.oid) AS definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'get_auth_company_id';
    `);
    console.log("\n✔ public.get_auth_company_id() SQL Definition:");
    if (functionDef.length > 0) {
      console.log(functionDef[0].definition);
    } else {
      console.log("❌ Function public.get_auth_company_id() not found!");
    }

  } catch (error) {
    console.error("❌ Failed to query RLS catalogs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
