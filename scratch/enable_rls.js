const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Starting Row Level Security (RLS) deployment on Supabase...");

  // Tables that contain a direct company_id relation
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
    // 1. Enable RLS on core User profiles (using auth.uid()::text)
    console.log("Enabling RLS on User table...");
    await prisma.$executeRawUnsafe(`ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS user_tenant_isolation ON public."User";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY user_tenant_isolation ON public."User"
      FOR ALL
      TO authenticated
      USING (
        id = auth.uid()::text OR
        company_id = (SELECT company_id FROM public."User" WHERE id = auth.uid()::text)
      )
      WITH CHECK (
        id = auth.uid()::text OR
        company_id = (SELECT company_id FROM public."User" WHERE id = auth.uid()::text)
      );
    `);

    // 2. Enable RLS on Company accounts
    console.log("Enabling RLS on Company table...");
    await prisma.$executeRawUnsafe(`ALTER TABLE public."Company" ENABLE ROW LEVEL SECURITY;`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS company_tenant_isolation ON public."Company";`);
    await prisma.$executeRawUnsafe(`
      CREATE POLICY company_tenant_isolation ON public."Company"
      FOR ALL
      TO authenticated
      USING (
        id = (SELECT company_id FROM public."User" WHERE id = auth.uid()::text) OR
        (SELECT company_id FROM public."User" WHERE id = auth.uid()::text) IS NULL
      );
    `);

    // 3. Enable RLS and add tenant policies on all business transaction tables
    for (const table of tenantTables) {
      console.log(`Enabling RLS on "${table}" table...`);
      await prisma.$executeRawUnsafe(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
      
      const policyName = `${table.toLowerCase()}_tenant_isolation`;
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS ${policyName} ON public."${table}";`);
      
      await prisma.$executeRawUnsafe(`
        CREATE POLICY ${policyName} ON public."${table}"
        FOR ALL
        TO authenticated
        USING (company_id = (SELECT company_id FROM public."User" WHERE id = auth.uid()::text))
        WITH CHECK (company_id = (SELECT company_id FROM public."User" WHERE id = auth.uid()::text));
      `);
    }

    console.log("✔ Row Level Security (RLS) and Tenant Isolation policies successfully deployed!");
  } catch (error) {
    console.error("❌ Failed to deploy security RLS policies:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
