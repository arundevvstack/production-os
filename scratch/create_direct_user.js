const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3] || "password123";
  const fullName = process.argv[4] || "Marketing Crew Member";

  if (!email) {
    console.log("\n❌ Email parameter required!");
    console.log("Usage: node scratch/create_direct_user.js <email> [password] [fullName]\n");
    process.exit(1);
  }

  console.log(`Starting transactional 100% GoTrue-Compatible provision bypass for user: ${email}...`);

  try {
    // Generate standard UUIDs
    const userId = require('crypto').randomUUID();
    const identityId = require('crypto').randomUUID();

    // Execute safe database transaction
    await prisma.$transaction(async (tx) => {
      // 1. Insert into auth.users with correct metadata
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
          is_super_admin
        )
        VALUES (
          '${userId}',
          '${email}',
          crypt('${password}', gen_salt('bf', 10)),
          '{"full_name": "${fullName}"}'::jsonb,
          '{"provider": "email", "providers": ["email"]}'::jsonb,
          now(),
          now(),
          '00000000-0000-0000-0000-000000000000',
          'authenticated',
          'authenticated',
          now(),
          now(),
          false
        );
      `);

      // 2. Insert into auth.identities (excluding the generated email column)
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
          '{"sub": "${userId}", "email": "${email}"}'::jsonb,
          'email',
          '${userId}',
          now(),
          now()
        );
      `);
    });

    console.log(`\n✔ Synchronized Account Provisioning Complete!`);
    console.log(`- Auth UUID: ${userId}`);
    console.log(`- Login Email: ${email}`);
    console.log(`- Password: ${password}`);
    
    // Check if trigger successfully created the public profile row
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
    console.error("\n❌ Failed to provision user:");
    console.error(error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
