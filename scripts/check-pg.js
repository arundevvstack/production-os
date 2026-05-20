import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:NewTarget@2026@db.dgskurtkixchdfhahzje.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Task';
  `);
  console.log(res.rows);
  await client.end();
}

run();
