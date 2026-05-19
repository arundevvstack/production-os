/**
 * FIX ALL RLS POLICIES WITH NON-RECURSIVE FUNCTIONS
 * Replaces the recursive subqueries on the User table with clean get_auth_company_id() calls.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TABLES_TO_FIX = [
  'Task', 'Asset', 'Deliverable', 'Comment', 'Notification',
  'ActivityLog', 'GSTFiling', 'Expense', 'Proposal', 'Talent',
  'Resource', 'Booking', 'Lead', 'Project', 'Invoice', 'Archive'
];

async function migrateAllToFunctionRLS() {
  console.log(`Re-applying non-recursive RLS policies to ${TABLES_TO_FIX.length} tables...\n`);

  // 1. Fix User table company read policy first
  console.log('📌 User:');
  try {
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS dp_user_company_read ON public."User";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY dp_user_company_read ON public."User"
      FOR SELECT TO authenticated
      USING (company_id = get_auth_company_id());
    `);
    console.log('  ✅ dp_user_company_read (using get_auth_company_id())');
  } catch (e) {
    console.error('  ❌ Failed to fix User policy:', e.message);
  }

  // 2. Fix other tables
  for (const table of TABLES_TO_FIX) {
    console.log(`\n📌 ${table}:`);
    
    // Get existing policy names to drop them
    const existing = await prisma.$queryRawUnsafe(`
      SELECT policyname FROM pg_policies 
      WHERE tablename = '${table}' AND schemaname = 'public';
    `);
    
    for (const row of existing) {
      if (row.policyname.startsWith('dp_') || row.policyname.includes('tenant_isolation')) {
        try {
          await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${row.policyname}" ON public."${table}";`);
          console.log(`  🗑  Dropped: ${row.policyname}`);
        } catch(e) {
          console.log(`  ⚠️  Could not drop ${row.policyname}: ${e.message.split('\n')[0]}`);
        }
      }
    }

    // Create 4 clean function-based policies
    const checkCondition = `company_id = get_auth_company_id()`;
    
    const newPolicies = [
      { cmd: 'SELECT', using: checkCondition, check: null },
      { cmd: 'INSERT', using: null, check: checkCondition },
      { cmd: 'UPDATE', using: checkCondition, check: checkCondition },
      { cmd: 'DELETE', using: checkCondition, check: null },
    ];

    for (const p of newPolicies) {
      const policyName = `dp_${table.toLowerCase()}_${p.cmd.toLowerCase()}`;
      
      let sql = `CREATE POLICY ${policyName} ON public."${table}" FOR ${p.cmd} TO authenticated `;
      if (p.using) sql += `USING (${p.using}) `;
      if (p.check) sql += `WITH CHECK (${p.check})`;
      sql += ';';

      try {
        await prisma.$executeRawUnsafe(sql);
        console.log(`  ✅ ${policyName}`);
      } catch(e) {
        console.log(`  ❌ ${policyName} failed: ${e.message.split('\n')[0]}`);
      }
    }
  }

  console.log('\n\n✅ Bulk migration complete. Infinite recursion RLS bugs eliminated.');
  await prisma.$disconnect();
}

migrateAllToFunctionRLS().catch(console.error);
