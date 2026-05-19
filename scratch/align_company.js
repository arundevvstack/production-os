const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = "marketing.defineperspective@gmail.com";
  const targetCompanyId = "comp_t40ew1byj"; // The admin's company ID
  console.log(`Migrating company workspace for user: ${email}...`);

  try {
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: {
        company_id: targetCompanyId,
        status: 'active',
        onboarding_status: 'completed',
        role_id: 'SUPER_ADMIN' // Keep Super Admin rights for total system visibility
      }
    });

    console.log(`\n✔ Workspace alignment complete!`);
    console.log(`- Email: ${updatedUser.email}`);
    console.log(`- Active Company ID: ${updatedUser.company_id} (Define Perspective - Admin Shared)`);
    console.log(`- Status: ${updatedUser.status}`);
    console.log(`- Role: ${updatedUser.role_id}`);

  } catch (error) {
    console.error("❌ Workspace alignment failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
