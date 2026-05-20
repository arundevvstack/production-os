import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dgskurtkixchdfhahzje.supabase.co';
const supabaseKey = 'sb_secret_haoOZsXGJlJ6VXkG1g0qtg_zLOt_1cM'; // from .env
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const { data, error } = await supabase.from('Task').insert({
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'task_' + Math.random().toString(36).substring(2, 15),
    company_id: 'some-company',
    project_id: 'some-project',
    title: 'Test',
    phase: 'pre-prod',
    assignedTo: 'Producer',
    status: 'todo',
    priority: 'Medium',
  }).select();

  console.log("Error:", error);
  console.log("Data:", data);
}

testInsert();
