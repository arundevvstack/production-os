/**
 * DEBUG SCRIPT — Check what's in public.User and why dashboard can't see pending users
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dgskurtkixchdfhahzje.supabase.co';
const serviceRoleKey = 'sb_secret_haoOZsXGJlJ6VXkG1g0qtg_zLOt_1cM';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function debugUsers() {
  console.log('=== PUBLIC.USER TABLE DEBUG ===\n');

  const { data: allUsers, error } = await supabase
    .from('User')
    .select('id, email, fullName, status, role_id, company_id, onboarding_status, department, createdAt')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('❌ Query error:', error.message);
    process.exit(1);
  }

  console.log(`Total users in public.User: ${allUsers.length}\n`);

  // Group by status
  const byStatus = {};
  for (const u of allUsers) {
    byStatus[u.status || 'null'] = (byStatus[u.status || 'null'] || 0) + 1;
  }
  console.log('Status breakdown:', byStatus);
  console.log('');

  // Show pending users
  const pending = allUsers.filter(u => u.status === 'pending');
  console.log(`\n📋 PENDING USERS (${pending.length}):`);
  for (const u of pending) {
    console.log(`  - ${u.email} | role: ${u.role_id} | company: ${u.company_id} | dept: ${u.department}`);
  }

  // Show all users
  console.log('\n📋 ALL USERS:');
  for (const u of allUsers) {
    console.log(`  [${u.status}] ${u.email} | role: ${u.role_id} | company_id: ${u.company_id}`);
  }

  // Check auth users
  console.log('\n=== AUTH.USERS ===');
  const { data: authData } = await supabase.auth.admin.listUsers();
  console.log(`Total auth users: ${authData.users.length}`);
  for (const u of authData.users) {
    console.log(`  - ${u.email} | confirmed: ${u.email_confirmed_at ? 'yes' : 'NO (unconfirmed)'} | created: ${u.created_at}`);
  }
}

debugUsers().catch(console.error);
