const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixArchiveIdDefault() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public."Archive" ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    `);
    console.log('✅ Archive.id now auto-generates UUID via gen_random_uuid()');
  } catch(e) {
    console.log('⚠️  Already set or error:', e.message);
  }

  // Also verify the Archive RLS allows inserts
  try {
    const policies = await prisma.$queryRawUnsafe(`
      SELECT policyname, cmd FROM pg_policies 
      WHERE tablename = 'Archive' AND schemaname = 'public';
    `);
    console.log('\n📋 Archive policies:', policies.map(p => `${p.policyname} (${p.cmd})`));
  } catch(e) {
    console.log('Could not check policies:', e.message);
  }

  await prisma.$disconnect();
}

fixArchiveIdDefault();
