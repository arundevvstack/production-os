const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addAdminUserUpdateRLS() {
  console.log('Adding RLS policy for SuperAdmins and Managers to update company users...');

  try {
    // Drop it if it exists
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Admins can update company users" ON public."User";`);

    // Create the policy
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Admins can update company users"
      ON public."User"
      FOR UPDATE
      TO authenticated
      USING (
        company_id = get_auth_company_id() AND 
        (SELECT role_id FROM public."User" WHERE id = auth.uid()::text) IN ('SUPER_ADMIN', 'MANAGER')
      )
      WITH CHECK (
        company_id = get_auth_company_id()
      );
    `);
    console.log('Successfully added "Admins can update company users" policy.');
  } catch (error) {
    console.error('Error adding policy:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAdminUserUpdateRLS();
