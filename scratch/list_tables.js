const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listTables() {
  try {
    const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Tables in Database:');
    console.log(tables.map(t => t.table_name));
  } catch (error) {
    console.error('Error listing tables:', error);
  } finally {
    await prisma.$disconnect();
  }
}

listTables();
