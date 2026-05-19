const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = "marketing.defineperspective@gmail.com";
  console.log(`Checking auth.users for: ${email}...`);

  try {
    const authUsers = await prisma.$queryRawUnsafe(`
      SELECT id, email, created_at, email_confirmed_at, last_sign_in_at
      FROM auth.users
      WHERE email = $1;
    `, email);
    
    console.log("✔ Records found in auth.users:");
    console.table(authUsers);
  } catch (error) {
    console.error("❌ Failed to query auth.users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
