require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testInsert() {
  const { data, error } = await supabase.from('Proposal').insert({
    company_id: 'test_company',
    title: 'Test Proposal',
    proposal_number: 'DP-PROP-2026-0001',
    content: JSON.stringify({}),
    status: 'draft',
  }).select();

  if (error) {
    console.error("SUPABASE ERROR:", error);
  } else {
    console.log("SUCCESS:", data);
  }
}

testInsert();
