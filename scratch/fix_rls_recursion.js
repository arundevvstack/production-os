const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Initiating Row Level Security (RLS) recursion fix...");

  const tenantTables = [
    "CompanySettings",
    "Lead",
    "Project",
    "Task",
    "Asset",
    "Deliverable",
    "Comment",
    "Notification",
    "ActivityLog",
    "Invoice",
    "GSTFiling",
    "Expense",
    "Proposal",
    "Talent",
    "Resource",
    "Booking"
  ];

  try {
    // 1. Create a SECURITY DEFINER helper function to bypass RLS recursion
    console.log("Registering security helper function 'get_auth_company_id'...");
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION public.get_auth_company_id()
      RETURNS text AS $$
        SELECT company_id::text FROM public."User" WHERE id = auth.uid()::text LIMIT 1;
      $$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
    `);

    // 2. Enable and apply non-recursive RLS to User table
    console.log("Enabling RLS on User table...");
    await prisma.$executeRawUnsafe(`ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS user_tenant_isolation ON public."User";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY user_tenant_isolation ON public."User"
      FOR ALL
      TO authenticated
      USING (
        id = auth.uid()::text OR
        company_id = public.get_auth_company_id()
      )
      WITH CHECK (
        id = auth.uid()::text OR
        company_id = public.get_auth_company_id()
      );
    `);

    // 3. Enable and apply non-recursive RLS to Company table
    console.log("Enabling RLS on Company table...");
    await prisma.$executeRawUnsafe(`ALTER TABLE public."Company" ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS company_tenant_isolation ON public."Company";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY company_tenant_isolation ON public."Company"
      FOR ALL
      TO authenticated
      USING (
        id = public.get_auth_company_id() OR
        public.get_auth_company_id() IS NULL
      );
    `);

    // 4. Apply optimized RLS policy to all transactional business tables
    for (const table of tenantTables) {
      console.log(`Enabling RLS on "${table}" table...`);
      await prisma.$executeRawUnsafe(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
      
      const policyName = `${table.toLowerCase()}_tenant_isolation`;
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS ${policyName} ON public."${table}";`);
      
      await prisma.$executeRawUnsafe(`
        CREATE POLICY ${policyName} ON public."${table}"
        FOR ALL
        TO authenticated
        USING (company_id = public.get_auth_company_id())
        WITH CHECK (company_id = public.get_auth_company_id());
      `);
    }

    console.log("✔ Row Level Security (RLS) recursion fix successfully deployed!");
  } catch (error) {
    console.error("❌ Failed to deploy security optimization:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
