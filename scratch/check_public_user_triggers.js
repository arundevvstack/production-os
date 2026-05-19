const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking all active triggers on public.User table...");

  try {
    const triggers = await prisma.$queryRawUnsafe(`
      SELECT 
        trigger_name, 
        event_manipulation, 
        action_statement, 
        action_timing
      FROM information_schema.triggers
      WHERE event_object_schema = 'public' AND event_object_table = 'User';
    `);
    
    console.log("✔ Active Triggers on public.User:");
    console.table(triggers);
  } catch (error) {
    console.error("❌ Failed to query public.User triggers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
