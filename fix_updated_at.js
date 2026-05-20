require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // Find all tables that have an updated_at column with no default
  const res = await client.query(`
    SELECT c.table_name, c.column_name, c.column_default, c.is_nullable
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'updated_at'
      AND c.column_default IS NULL
    ORDER BY c.table_name;
  `);
  
  console.log('Tables with updated_at but no default:');
  console.log(res.rows.map(r => r.table_name));

  // Set default NOW() on all of them
  for (const row of res.rows) {
    await client.query(`ALTER TABLE public."${row.table_name}" ALTER COLUMN updated_at SET DEFAULT NOW();`);
    console.log(`✓ Fixed updated_at default on ${row.table_name}`);
  }

  // Also create a trigger function to auto-update updated_at on every UPDATE
  await client.query(`
    CREATE OR REPLACE FUNCTION public.set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  console.log('✓ Created set_updated_at() trigger function');

  // Apply trigger to all tables that have updated_at
  const allUpdatedAt = await client.query(`
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updated_at'
    ORDER BY table_name;
  `);

  for (const row of allUpdatedAt.rows) {
    const tbl = row.table_name;
    const triggerName = `trg_${tbl}_updated_at`;
    await client.query(`DROP TRIGGER IF EXISTS "${triggerName}" ON public."${tbl}";`);
    await client.query(`
      CREATE TRIGGER "${triggerName}"
      BEFORE UPDATE ON public."${tbl}"
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    `);
    console.log(`✓ Applied update trigger on ${tbl}`);
  }

  await client.end();
  console.log('\nAll done!');
}

main().catch(e => { console.error(e); client.end(); });
