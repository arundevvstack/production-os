const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = "arundevv.com@gmail.com";
  console.log(`Inspecting profile for user: ${email}...`);

  try {
    const user = await prisma.user.findUnique({
      where: { email: email }
    });
    
    console.log("✔ Profile Fields:");
    console.dir(user, { depth: null });
  } catch (error) {
    console.error("❌ Failed to query user profile:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
