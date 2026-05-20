const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addDeletePolicy() {
  console.log('Adding DELETE policy to User table...');

  try {
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Admins can delete company users" ON public."User";`);
    
    // Create the DELETE policy
    // Allow if the user being deleted belongs to the current user's company (or is pending with null company, handled by admin's company id)
    // Actually, if a user is pending, they might have the same company_id as the admin or null.
    // In RBAC page, pending users are loaded because they have the same company_id.
    const sql = `
      CREATE POLICY "Admins can delete company users"
      ON public."User"
      FOR DELETE
      TO authenticated
      USING (
        (company_id = get_auth_company_id() OR company_id IS NULL)
        AND (
          SELECT role_id FROM public."User" WHERE id = (auth.uid())::text
        ) IN ('SUPER_ADMIN', 'MANAGER')
      );
    `;

    await prisma.$executeRawUnsafe(sql);
    console.log('DELETE policy added successfully!');
  } catch (err) {
    console.error('Error adding policy:', err);
  } finally {
    await prisma.$disconnect();
  }
}

addDeletePolicy();
