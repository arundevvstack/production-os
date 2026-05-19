const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Deep auditing every column in auth.users side-by-side...");

  try {
    const users = await prisma.$queryRawUnsafe(`
      SELECT *
      FROM auth.users;
    `);

    if (users.length < 2) {
      console.log("Not enough users to compare side-by-side!");
      return;
    }

    const working = users.find(u => u.email === "arundevv.com@gmail.com");
    const newly = users.find(u => u.email === "marketing.defineperspective@gmail.com");

    if (!working || !newly) {
      console.log("Could not locate both users in auth.users!");
      return;
    }

    // Get all column keys
    const keys = Object.keys(working);
    console.log(`\nFound ${keys.length} columns in auth.users. Side-by-side audit:`);

    const comparison = {};
    keys.forEach(key => {
      comparison[key] = {
        "Working (arundevv.com)": typeof working[key] === 'object' ? JSON.stringify(working[key]) : working[key],
        "Manually Created": typeof newly[key] === 'object' ? JSON.stringify(newly[key]) : newly[key]
      };
    });

    console.table(comparison);

  } catch (error) {
    console.error("❌ Failed to query columns:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
