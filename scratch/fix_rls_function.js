const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Redeploying public.get_auth_company_id() as a PL/pgSQL function to prevent RLS recursion...");

  const fixFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.get_auth_company_id()
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      comp_id text;
    BEGIN
      SELECT company_id::text INTO comp_id 
      FROM public."User" 
      WHERE id = auth.uid()::text 
      LIMIT 1;
      
      RETURN comp_id;
    END;
    $$;
  `;

  try {
    await prisma.$executeRawUnsafe(fixFunctionSQL);
    console.log("✔ Helper function public.get_auth_company_id() successfully converted to PL/pgSQL!");
    
    // Quick test: execute the function to make sure it runs without crashing
    const testResult = await prisma.$queryRawUnsafe(`SELECT public.get_auth_company_id() AS comp_id;`);
    console.log("✔ Verification test run completed. Output:", testResult);

  } catch (error) {
    console.error("❌ Failed to redeploy function:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
