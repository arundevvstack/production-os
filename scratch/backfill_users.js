/**
 * BACKFILL SCRIPT
 * Syncs all existing auth.users into public.User 
 * for users who registered before the trigger was deployed.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dgskurtkixchdfhahzje.supabase.co';
const serviceRoleKey = 'sb_secret_haoOZsXGJlJ6VXkG1g0qtg_zLOt_1cM';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function backfillUsers() {
  console.log('🔍 Fetching all auth users...');

  // Get all auth users using service role
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error('❌ Failed to list auth users:', authError.message);
    process.exit(1);
  }

  console.log(`📋 Found ${authUsers.users.length} auth users.`);

  // Get all existing public.User IDs
  const { data: existingUsers, error: existingError } = await supabase
    .from('User')
    .select('id');
  
  if (existingError) {
    console.error('❌ Failed to fetch existing users:', existingError.message);
    process.exit(1);
  }

  const existingIds = new Set(existingUsers.map(u => u.id));
  console.log(`✅ Found ${existingIds.size} existing public.User rows.`);

  // Get first company for default assignment
  const { data: companies } = await supabase.from('Company').select('id').limit(1);
  const firstCompanyId = companies && companies.length > 0 ? companies[0].id : null;
  console.log(`🏢 Using company_id: ${firstCompanyId}`);

  // Find unsynced users
  const unsyncedUsers = authUsers.users.filter(u => !existingIds.has(u.id));
  console.log(`⚠️  ${unsyncedUsers.length} unsynced users found. Backfilling now...`);

  let successCount = 0;
  let failCount = 0;

  for (const user of unsyncedUsers) {
    const role = user.user_metadata?.role || 'EMPLOYEE';
    const dept = role === 'TALENT' ? 'Talent' : role === 'CLIENT' ? 'Client' : 'Production';
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown User';

    const { error } = await supabase.from('User').upsert({
      id: user.id,
      email: user.email,
      fullName,
      status: 'pending',
      role_id: role,
      company_id: firstCompanyId,
      onboarding_status: 'awaiting_approval',
      department: dept,
      createdAt: user.created_at
    }, { onConflict: 'id' });

    if (error) {
      console.error(`  ❌ Failed to sync ${user.email}: ${error.message}`);
      failCount++;
    } else {
      console.log(`  ✅ Synced: ${user.email} (${role})`);
      successCount++;
    }
  }

  console.log(`\n🎯 Backfill complete: ${successCount} synced, ${failCount} failed.`);
  if (successCount > 0) {
    console.log('✨ These users will now appear in the Pending User Clearances panel.');
  }
}

backfillUsers().catch(console.error);
