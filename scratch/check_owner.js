const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking function owner...");

  try {
    const owner = await prisma.$queryRawUnsafe(`
      SELECT 
        r.rolname AS owner_name,
        p.prosecdef AS is_security_definer
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_roles r ON p.proowner = r.oid
      WHERE n.nspname = 'public' AND p.proname = 'get_auth_company_id';
    `);
    
    console.log("✔ Function Owner details:");
    console.table(owner);
  } catch (error) {
    console.error("❌ Failed to query function owner:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
