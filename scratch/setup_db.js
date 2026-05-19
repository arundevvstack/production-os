const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Setting up PostgreSQL trigger for auth.users -> public.User synchronization...");

  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    DECLARE
      first_company_id text;
      assigned_role text;
      assigned_dept text;
    BEGIN
      -- Defensive: Extract role from metadata, default to EMPLOYEE
      assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'EMPLOYEE');
      
      -- Assign default department based on role
      IF assigned_role = 'TALENT' THEN
        assigned_dept := 'Talent';
      ELSIF assigned_role = 'CLIENT' THEN
        assigned_dept := 'Client';
      ELSE
        assigned_dept := 'Production';
      END IF;

      -- Look up the ID of the single active agency company (Single Agency Intranet Mode)
      SELECT id::text INTO first_company_id FROM public."Company" LIMIT 1;
      
      -- If no company exists, bootstrap one immediately to prevent NULL constraint errors
      IF first_company_id IS NULL THEN
        INSERT INTO public."Company" (id, name, "onboardingStatus") 
        VALUES (gen_random_uuid()::text, 'Define Perspective', 'completed')
        RETURNING id INTO first_company_id;
      END IF;

      -- Fault-tolerant transactional safety: Wrap insert in exception block
      BEGIN
        INSERT INTO public."User" (
          id, 
          email, 
          "fullName", 
          status, 
          role_id, 
          company_id, 
          onboarding_status,
          department,
          "createdAt"
        )
        VALUES (
          new.id,
          new.email,
          COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
          'pending',
          assigned_role,
          first_company_id,
          'awaiting_approval',
          assigned_dept,
          now()
        )
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            company_id = COALESCE(public."User".company_id, EXCLUDED.company_id),
            "fullName" = COALESCE(public."User"."fullName", EXCLUDED."fullName"),
            role_id = COALESCE(public."User".role_id, EXCLUDED.role_id),
            department = COALESCE(public."User".department, EXCLUDED.department);
      EXCEPTION
        WHEN others THEN
          -- Log detailed error into Postgres logs so it doesn't fail silently
          RAISE WARNING 'handle_new_user trigger exception captured: % %', SQLERRM, SQLSTATE;
          -- We still return new so Auth doesn't fail, but we've logged it.
      END;

      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
  `;

  const dropTriggerSQL = `
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  `;

  const createTriggerSQL = `
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `;

  try {
    console.log("1. Creating trigger function public.handle_new_user()...");
    await prisma.$executeRawUnsafe(createFunctionSQL);
    
    console.log("2. Dropping existing trigger if active...");
    await prisma.$executeRawUnsafe(dropTriggerSQL);
    
    console.log("3. Registering trigger on_auth_user_created...");
    await prisma.$executeRawUnsafe(createTriggerSQL);

    console.log("✔ Synchronization trigger and handler function successfully deployed!");
  } catch (error) {
    console.error("❌ Failed to deploy synchronization trigger:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
