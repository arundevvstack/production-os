require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testInsert() {
  const { data, error } = await supabase.from('Invoice').insert({
    company_id: 'test_company',
    client_id: null,
    project_id: 'test_project',
    invoice_number: 'DP-INV-001',
    subtotal: 1000,
    gst_amount: 180,
    total: 1180,
    payment_status: 'unpaid',
    issue_date: new Date().toISOString(),
    due_date: new Date().toISOString(),
    gst_filed: false,
    line_items: []
  }).select();

  if (error) {
    console.error("SUPABASE ERROR:", error);
  } else {
    console.log("SUCCESS:", data);
  }
}

testInsert();
