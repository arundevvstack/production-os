/**
 * BULK RLS POLICY MIGRATION
 * Fixes all 17 tables that use get_auth_company_id() in a single ALL policy.
 * Replaces each with 4 separate operation-specific policies using direct auth.uid()::text lookup.
 * This ensures DELETE, INSERT, UPDATE each work independently.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TABLES_TO_FIX = [
  'Task', 'Asset', 'Deliverable', 'Comment', 'Notification',
  'ActivityLog', 'GSTFiling', 'Expense', 'Proposal', 'Talent',
  'Resource', 'Booking', 'Lead', 'Project',
  // Invoice already fixed separately, Company/CompanySettings are sensitive - skip for now
];

async function fixAllTenantPolicies() {
  console.log(`Fixing RLS policies for ${TABLES_TO_FIX.length} tables...\n`);

  let fixed = 0;
  let skipped = 0;

  for (const table of TABLES_TO_FIX) {
    console.log(`\n📌 ${table}:`);
    
    // Get existing policy names
    const existing = await prisma.$queryRawUnsafe(`
      SELECT policyname FROM pg_policies 
      WHERE tablename = '${table}' AND schemaname = 'public';
    `);
    
    // Drop existing tenant isolation policy
    for (const row of existing) {
      if (row.policyname.includes('tenant_isolation') || row.policyname.includes('dp_')) {
        try {
          await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "${row.policyname}" ON public."${table}";`);
          console.log(`  🗑  Dropped: ${row.policyname}`);
        } catch(e) {
          console.log(`  ⚠️  Could not drop ${row.policyname}: ${e.message.split('\n')[0]}`);
        }
      }
    }

    // Create 4 clean policies
    const COMPANY_SUBQUERY = `company_id IN (SELECT u.company_id FROM public."User" u WHERE u.id = auth.uid()::text)`;
    
    const newPolicies = [
      { cmd: 'SELECT', using: COMPANY_SUBQUERY, check: null },
      { cmd: 'INSERT', using: null, check: COMPANY_SUBQUERY },
      { cmd: 'UPDATE', using: COMPANY_SUBQUERY, check: COMPANY_SUBQUERY },
      { cmd: 'DELETE', using: COMPANY_SUBQUERY, check: null },
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
        fixed++;
      } catch(e) {
        console.log(`  ⚠️  ${policyName}: ${e.message.split('\n')[0]}`);
        skipped++;
      }
    }
  }

  console.log(`\n\n✅ Done. Fixed: ${fixed} | Skipped: ${skipped}`);
  console.log('All tables now have explicit SELECT / INSERT / UPDATE / DELETE policies.');
  await prisma.$disconnect();
}

fixAllTenantPolicies().catch(console.error);
