const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showArchiveColumns() {
  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Archive' AND table_schema = 'public';
    `);
    console.log('Archive Table Columns:');
    console.log(res);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showArchiveColumns();
