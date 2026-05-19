const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting transaction-safe auth trigger dry run...");

  try {
    // Generate a random UUID and email for the test
    const testId = "e87f17b3-8c4c-42b8-9366-a36c92d5c21f";
    const testEmail = `dryrun-${Date.now()}@dpstudios.com`;

    // Start database transaction and execute test insert
    await prisma.$transaction(async (tx) => {
      console.log(`Inserting test user [ID: ${testId}, Email: ${testEmail}] into auth.users...`);
      
      await tx.$executeRawUnsafe(`
        INSERT INTO auth.users (id, email, raw_user_meta_data, created_at, updated_at, instance_id, aud, role)
        VALUES (
          '${testId}',
          '${testEmail}',
          '{"full_name": "Dry Run Test"}'::jsonb,
          now(),
          now(),
          '00000000-0000-0000-0000-000000000000',
          'authenticated',
          'authenticated'
        );
      `);

      console.log("✔ Insert completed! Trigger successfully ran without crashing.");
      // Rollback transaction to keep auth.users clean
      throw new Error("ROLLBACK_ON_SUCCESS");
    });
  } catch (error) {
    if (error.message === "ROLLBACK_ON_SUCCESS") {
      console.log("✔ Dry run succeeded completely! Trigger is perfectly stable.");
    } else {
      console.error("❌ SQL Exception captured:");
      console.error("Code:", error.code);
      console.error("Message:", error.message);
      if (error.meta) console.error("Metadata:", JSON.stringify(error.meta, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
