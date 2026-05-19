const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching all database triggers across all schemas...");

  try {
    const triggers = await prisma.$queryRawUnsafe(`
      SELECT 
        event_object_schema, 
        event_object_table, 
        trigger_name, 
        event_manipulation, 
        action_statement, 
        action_timing
      FROM information_schema.triggers
      ORDER BY event_object_schema, event_object_table, trigger_name;
    `);
    
    console.log("\n✔ All Active Triggers:");
    console.table(triggers);
  } catch (error) {
    console.error("❌ Failed to query database triggers:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
