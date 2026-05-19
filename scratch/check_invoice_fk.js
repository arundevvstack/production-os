const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFKConstraints() {
  try {
    // Check foreign keys pointing to Invoice table
    const fks = await prisma.$queryRawUnsafe(`
      SELECT
        tc.table_name AS foreign_table,
        kcu.column_name AS foreign_column,
        ccu.table_name AS primary_table,
        ccu.column_name AS primary_column,
        rc.delete_rule AS on_delete
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (ccu.table_name = 'Invoice' OR tc.table_name = 'Invoice');
    `);
    
    console.log('Foreign Key Constraints involving Invoice:');
    console.log(fks);
  } catch (error) {
    console.error('Error fetching FK constraints:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFKConstraints();
