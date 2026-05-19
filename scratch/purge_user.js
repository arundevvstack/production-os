const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = "marketing.defineperspective@gmail.com";
  console.log(`Starting clean database purge for: ${email}...`);

  try {
    // 1. Delete from public.User first to ensure referential safety
    console.log("1. Purging public.User profile...");
    const deletedPublic = await prisma.user.deleteMany({
      where: { email: email }
    });
    console.log(`- Deleted public profiles: ${deletedPublic.count}`);

    // 2. Delete directly from auth.users using privileged SQL
    console.log("2. Purging auth.users record...");
    await prisma.$executeRawUnsafe(`
      DELETE FROM auth.users WHERE email = $1;
    `, email);
    console.log(`- Deleted auth.users record successfully!`);

    console.log(`\n✔ Clean purge complete! The user "${email}" has been completely wiped from your Supabase database.`);

  } catch (error) {
    console.error("❌ Purge failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
