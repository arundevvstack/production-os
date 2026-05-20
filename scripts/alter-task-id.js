import pg from 'pg';

const client = new pg.Client({
  connectionString: 'postgresql://postgres:NewTarget@2026@db.dgskurtkixchdfhahzje.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  
  try {
    // Check if id is uuid or text
    const res = await client.query(`
      SELECT data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'Task' AND column_name = 'id';
    `);
    console.log("Current id column:", res.rows);

    // Alter table to set default
    // If it's text, we can use gen_random_uuid()::text
    // If it's uuid, we can use gen_random_uuid()
    
    await client.query(`
      ALTER TABLE "Task" 
      ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
    `);
    
    console.log("Successfully added default uuid generator to Task.id");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
