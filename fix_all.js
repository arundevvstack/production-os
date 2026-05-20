require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // 1. Check existing data
  const companies = await client.query('SELECT * FROM public."Company"');
  console.log('Companies:', companies.rows);

  const users = await client.query('SELECT id, email, "fullName", company_id, role_id, status FROM public."User"');
  console.log('Users:', users.rows);

  const prospects = await client.query('SELECT id, company_name, stage FROM public."Prospect"');
  console.log('Prospects:', prospects.rows);

  // 2. Fix Company.updatedAt default
  await client.query(`ALTER TABLE public."Company" ALTER COLUMN "updatedAt" SET DEFAULT NOW();`);
  console.log('\n✓ Fixed Company.updatedAt default');

  // 3. Add trigger for Company.updatedAt  
  await client.query(`DROP TRIGGER IF EXISTS "trg_Company_updatedAt" ON public."Company";`);
  await client.query(`
    CREATE OR REPLACE FUNCTION public.set_company_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW."updatedAt" = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await client.query(`
    CREATE TRIGGER "trg_Company_updatedAt"
    BEFORE UPDATE ON public."Company"
    FOR EACH ROW EXECUTE FUNCTION public.set_company_updated_at();
  `);
  console.log('✓ Created Company updatedAt trigger');

  // 4. Fix User.updatedAt default (also uses @updatedAt)  
  const userCols = await client.query(`
    SELECT column_name, column_default FROM information_schema.columns 
    WHERE table_name='User' AND column_name IN ('updatedAt','updated_at')
  `);
  console.log('\nUser date columns:', userCols.rows);
  
  for (const col of userCols.rows) {
    if (!col.column_default) {
      await client.query(`ALTER TABLE public."User" ALTER COLUMN "${col.column_name}" SET DEFAULT NOW();`);
      console.log(`✓ Fixed User.${col.column_name} default`);
    }
  }

  // 5. Check ALL tables for any column named updatedAt (camelCase) missing defaults
  const camelCaseCols = await client.query(`
    SELECT table_name, column_name, column_default 
    FROM information_schema.columns 
    WHERE table_schema='public' AND column_name='updatedAt' AND column_default IS NULL;
  `);
  console.log('\nTables with updatedAt but no default:', camelCaseCols.rows);
  for (const row of camelCaseCols.rows) {
    await client.query(`ALTER TABLE public."${row.table_name}" ALTER COLUMN "updatedAt" SET DEFAULT NOW();`);
    console.log(`✓ Fixed ${row.table_name}.updatedAt`);
  }

  // 6. Reload PostgREST cache
  await client.query(`NOTIFY pgrst, 'reload schema';`);
  console.log('\n✓ Schema cache reloaded');

  await client.end();
}

main().catch(e => { console.error(e); });
