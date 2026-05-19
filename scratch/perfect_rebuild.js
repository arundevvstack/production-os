const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = "marketing.defineperspective@gmail.com";
  console.log(`Starting perfect synchronized profile rebuild for: ${email}...`);

  try {
    // 1. Delete from public.User first
    console.log("1. Purging public.User profile...");
    const deletedPublic = await prisma.user.deleteMany({
      where: { email: email }
    });
    console.log(`- Deleted public profiles: ${deletedPublic.count}`);

    // 2. Delete from auth.users
    console.log("2. Purging auth.users record...");
    await prisma.$executeRawUnsafe(`
      DELETE FROM auth.users WHERE email = $1;
    `, email);
    console.log(`- Deleted auth record`);

    // 3. Provision the perfect user matching the working user's schema exactly
    console.log("3. Provisioning perfect synchronized credentials...");
    const userId = "be4467f8-d286-4386-a43a-8591af4ecc44"; // Fixed ID for stability
    const identityId = require('crypto').randomUUID();
    const password = "password123";

    await prisma.$transaction(async (tx) => {
      // Insert into auth.users with empty strings for tokens, email_verified, and null for superadmin (excluding generated confirmed_at)
      await tx.$executeRawUnsafe(`
        INSERT INTO auth.users (
          id, 
          email, 
          encrypted_password, 
          raw_user_meta_data, 
          raw_app_meta_data,
          created_at, 
          updated_at, 
          instance_id, 
          aud, 
          role,
          email_confirmed_at,
          last_sign_in_at,
          is_super_admin,
          confirmation_token,
          recovery_token,
          email_change_token_new,
          email_change,
          phone_change,
          phone_change_token,
          reauthentication_token,
          is_sso_user,
          is_anonymous
        )
        VALUES (
          '${userId}',
          '${email}',
          crypt('${password}', gen_salt('bf', 10)),
          '{"full_name": "Marketing Manager", "email_verified": true}'::jsonb,
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          now(),
          now(),
          '00000000-0000-0000-0000-000000000000',
          'authenticated',
          'authenticated',
          now(),
          now(),
          null,
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          false,
          false
        );
      `);

      // Insert into auth.identities with verified email flags
      await tx.$executeRawUnsafe(`
        INSERT INTO auth.identities (
          id,
          user_id,
          identity_data,
          provider,
          provider_id,
          created_at,
          updated_at
        )
        VALUES (
          '${identityId}',
          '${userId}',
          '{"sub": "${userId}", "email": "${email}", "email_verified": true, "phone_verified": false}'::jsonb,
          'email',
          '${userId}',
          now(),
          now()
        );
      `);
    });

    console.log(`\n✔ Perfect Synchronized Account Rebuild Complete!`);
    console.log(`- Auth UUID: ${userId}`);
    console.log(`- Login Email: ${email}`);
    console.log(`- Password: ${password}`);

    // Verify trigger successfully created public profile
    const publicProfile = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (publicProfile) {
      console.log(`✔ Public profile successfully generated: YES`);
      console.log(`- Bound to Corporate Agency: ${publicProfile.company_id}`);
      console.log(`- Clearance Level: ${publicProfile.role_id}`);
      console.log(`- Department: ${publicProfile.department}`);
      console.log(`- Status: ${publicProfile.status} (Ready to Log In!)`);
    } else {
      console.log(`❌ Public profile generation failed! Check database logs.`);
    }

  } catch (error) {
    console.error("❌ Process failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
