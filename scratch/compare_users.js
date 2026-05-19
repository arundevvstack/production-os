const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Comparing auth.users records to find differences...");

  try {
    const users = await prisma.$queryRawUnsafe(`
      SELECT *
      FROM auth.users
      ORDER BY email_confirmed_at NULLS LAST, created_at DESC;
    `);

    if (users.length === 0) {
      console.log("No users found in auth.users!");
      return;
    }

    console.log(`Found ${users.length} users in auth.users.`);
    
    // Print all columns for each user to compare
    users.forEach((u, index) => {
      console.log(`\n--- USER [${index}] ---`);
      console.log(`Email: ${u.email}`);
      console.log(`ID: ${u.id}`);
      console.log(`Confirmation:`, u.email_confirmed_at);
      console.log(`App Metadata:`, JSON.stringify(u.raw_app_meta_data));
      console.log(`User Metadata:`, JSON.stringify(u.raw_user_meta_data));
      console.log(`Role: ${u.role}`);
      console.log(`Aud: ${u.aud}`);
      console.log(`Banned: ${u.banned_until}`);
      console.log(`Deleted: ${u.deleted_at}`);
      console.log(`Is Super Admin: ${u.is_super_admin}`);
    });

  } catch (error) {
    console.error("❌ Failed to compare users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
