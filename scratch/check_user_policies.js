const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const policies = await prisma.$queryRaw`SELECT policyname, cmd, roles, qual, with_check FROM pg_policies WHERE tablename = 'User'`;
  console.log(policies);
}

main().finally(() => prisma.$disconnect());
