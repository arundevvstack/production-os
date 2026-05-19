const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Comparing auth.identities records to find differences...");

  try {
    const identities = await prisma.$queryRawUnsafe(`
      SELECT *
      FROM auth.identities;
    `);

    console.log(`Found ${identities.length} records in auth.identities.`);
    
    identities.forEach((id, index) => {
      console.log(`\n--- IDENTITY [${index}] ---`);
      console.log(`ID: ${id.id}`);
      console.log(`User ID: ${id.user_id}`);
      console.log(`Provider: ${id.provider}`);
      console.log(`Provider ID: ${id.provider_id}`);
      console.log(`Identity Data:`, JSON.stringify(id.identity_data));
      console.log(`Created At:`, id.created_at);
      console.log(`Updated At:`, id.updated_at);
    });

  } catch (error) {
    console.error("❌ Failed to compare identities:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
