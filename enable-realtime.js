const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = [
    'Company', 'User', 'Client', 'Prospect', 'Project', 'Invoice', 'Expense', 'Meeting', 'CommunicationLog'
  ];
  
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER PUBLICATION supabase_realtime ADD TABLE "${table}";`);
      console.log(`Enabled realtime for ${table}`);
    } catch (e) {
      console.log(`Could not enable realtime for ${table} (might already be added):`, e.message);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
