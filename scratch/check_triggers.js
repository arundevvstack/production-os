const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching all triggers on auth.users table...");

  try {
    const triggers = await prisma.$queryRawUnsafe(`
      SELECT 
        trigger_name, 
        event_manipulation, 
        action_statement, 
        action_timing
      FROM information_schema.triggers
      WHERE event_object_schema = 'auth' AND event_object_table = 'users';
    `);
    
    console.log("✔ Active Triggers on auth.users:");
    console.table(triggers);
  } catch (error) {
    console.error("❌ Failed to query triggers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
