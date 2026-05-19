const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = "8946e86a-7bed-429f-ae64-775d94e2c8a8";
  console.log(`Checking if user row exists in public.User for: ${userId}...`);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });
    
    console.log("✔ User row details:", user);
  } catch (error) {
    console.error("❌ Failed to query user table:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
