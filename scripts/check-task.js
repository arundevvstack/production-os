import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://dgskurtkixchdfhahzje.supabase.co',
  'sb_secret_haoOZsXGJlJ6VXkG1g0qtg_zLOt_1cM'
);

async function run() {
  const { data, error } = await supabase.from('Task').select('*').limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
