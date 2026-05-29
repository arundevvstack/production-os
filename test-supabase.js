require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testInsert() {
  const { data, error } = await supabase.from('Invoice').select('*').limit(1);
  if (error) {
    console.error('SUPABASE ERROR:', error);
  } else {
    console.log('SUCCESS:', JSON.stringify(data, null, 2));
  }
}

testInsert();
