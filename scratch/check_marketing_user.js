const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = "marketing.defineperspective@gmail.com";
  console.log(`Checking public.User for: ${email}...`);

  try {
    const user = await prisma.user.findFirst({
      where: { email: email }
    });
    
    console.log("✔ User row in public.User:", user);
  } catch (error) {
    console.error("❌ Failed to query User table:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
