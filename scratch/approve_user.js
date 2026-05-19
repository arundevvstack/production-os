const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = "marketing.defineperspective@gmail.com";
  console.log(`Instantly approving and promoting: ${email}...`);

  try {
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: {
        status: 'active',               // Change from 'pending' to 'active'
        onboarding_status: 'completed', // Complete onboarding
        role_id: 'SUPER_ADMIN'          // Grant Super Admin credentials for testing
      }
    });

    console.log(`\n✔ Promotion complete!`);
    console.log(`- Email: ${updatedUser.email}`);
    console.log(`- New Status: ${updatedUser.status} (APPROVED)`);
    console.log(`- Clearance Level: ${updatedUser.role_id} (SUPER_ADMIN)`);
    console.log(`- Onboarding Status: ${updatedUser.onboarding_status}`);

  } catch (error) {
    console.error("❌ Promotion failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
