const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Comparing public.User rows to find differences...");

  try {
    const users = await prisma.user.findMany();
    
    console.log(`Found ${users.length} users in public.User.`);
    console.table(users);
  } catch (error) {
    console.error("❌ Failed to query public.User table:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
