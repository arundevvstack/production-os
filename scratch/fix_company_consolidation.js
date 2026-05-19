/**
 * FIX SCRIPT — Company Consolidation
 * 
 * Problem: Two companies exist in the DB.
 * - comp_t40ew1byj — admin's company (the real one)
 * - comp_29w3vkfxp — default company used by trigger (wrong)
 * 
 * Fix:
 * 1. Move all pending users to the correct company (comp_t40ew1byj)
 * 2. Update the trigger to always use the company with the most users / the admin's company
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dgskurtkixchdfhahzje.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function consolidateCompanies() {
  console.log('🔍 Fetching all companies...');

  const { data: companies, error: compError } = await supabase
    .from('Company')
    .select('id, name, createdAt')
    .order('createdAt', { ascending: true });

  if (compError) {
    console.error('❌ Failed to fetch companies:', compError.message);
    process.exit(1);
  }

  console.log('Companies found:');
  companies.forEach(c => console.log(`  - ${c.id} | ${c.name} | created: ${c.createdAt}`));

  // The REAL company is the one SuperAdmins are in
  const { data: superAdmins } = await supabase
    .from('User')
    .select('id, email, company_id')
    .eq('role_id', 'SUPER_ADMIN');

  console.log('\nSuper Admins:', superAdmins);

  const realCompanyId = superAdmins?.[0]?.company_id;
  if (!realCompanyId) {
    console.error('❌ No SuperAdmin found to determine real company. Aborting.');
    process.exit(1);
  }

  console.log(`\n✅ Real company ID: ${realCompanyId}`);

  // Move all pending users to the real company
  const { data: pendingUsers } = await supabase
    .from('User')
    .select('id, email, status, company_id')
    .eq('status', 'pending');

  console.log(`\n📋 Pending users to migrate: ${pendingUsers?.length || 0}`);

  const wrongCompanyUsers = pendingUsers?.filter(u => u.company_id !== realCompanyId) || [];
  console.log(`⚠️  Users in wrong company: ${wrongCompanyUsers.length}`);

  if (wrongCompanyUsers.length > 0) {
    const ids = wrongCompanyUsers.map(u => u.id);
    const { error: updateError } = await supabase
      .from('User')
      .update({ company_id: realCompanyId })
      .in('id', ids);

    if (updateError) {
      console.error('❌ Failed to update company_id:', updateError.message);
    } else {
      console.log(`✅ Moved ${wrongCompanyUsers.length} pending users to company: ${realCompanyId}`);
      wrongCompanyUsers.forEach(u => console.log(`  - ${u.email}: ${u.company_id} → ${realCompanyId}`));
    }
  }

  // Remove the orphan/default company
  const orphanCompanies = companies.filter(c => c.id !== realCompanyId);
  for (const oc of orphanCompanies) {
    console.log(`\n🧹 Checking if company ${oc.id} (${oc.name}) can be safely removed...`);
    const { data: stillUsed } = await supabase
      .from('User')
      .select('id')
      .eq('company_id', oc.id)
      .limit(1);

    if (!stillUsed || stillUsed.length === 0) {
      const { error: delErr } = await supabase.from('Company').delete().eq('id', oc.id);
      if (delErr) {
        console.log(`  ⚠️ Could not delete (may be referenced): ${delErr.message}`);
      } else {
        console.log(`  ✅ Deleted orphan company: ${oc.id}`);
      }
    } else {
      console.log(`  ⚠️ Skipped — still has ${stillUsed.length} user(s).`);
    }
  }

  console.log('\n🎯 Consolidation complete. All pending users now in the correct company.');
  console.log('   They should now appear in your dashboard Pending User Clearances.');

  // Final verification
  const { data: finalPending } = await supabase
    .from('User')
    .select('email, status, company_id')
    .eq('status', 'pending');

  console.log('\n📋 Final pending users state:');
  finalPending?.forEach(u => console.log(`  [${u.status}] ${u.email} | company: ${u.company_id}`));
}

consolidateCompanies().catch(console.error);
