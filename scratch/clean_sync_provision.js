const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = "marketing.defineperspective@gmail.com";
  console.log(`Starting clean sync profile rebuild for: ${email}...`);

  try {
    // 1. Delete any existing rows in public.User with this email
    console.log("1. Cleaning up orphaned public profiles...");
    const deletedUser = await prisma.user.deleteMany({
      where: { email: email }
    });
    console.log(`- Deleted public.User rows: ${deletedUser.count}`);

    // 2. Delete any existing rows in auth.users with this email to prevent conflicts
    console.log("2. Cleaning up auth records...");
    const deletedAuth = await prisma.$executeRawUnsafe(`
      DELETE FROM auth.users WHERE email = $1;
    `, email);
    console.log(`- Deleted auth.users rows`);

    // 3. Provision a fresh, synchronized auth account using direct DB bypass
    console.log("3. Provisioning fresh synchronized credentials...");
    const userId = require('crypto').randomUUID();
    const password = "password123";

    await prisma.$executeRawUnsafe(`
      INSERT INTO auth.users (
        id, 
        email, 
        encrypted_password, 
        raw_user_meta_data, 
        created_at, 
        updated_at, 
        instance_id, 
        aud, 
        role,
        email_confirmed_at,
        last_sign_in_at
      )
      VALUES (
        '${userId}',
        '${email}',
        crypt('${password}', gen_salt('bf', 10)),
        '{"full_name": "Marketing Operations Manager"}'::jsonb,
        now(),
        now(),
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        now(),
        now()
      );
    `);

    console.log(`✔ Direct DB Provision Bypass complete!`);
    console.log(`- Auth UUID: ${userId}`);
    console.log(`- Login Email: ${email}`);
    console.log(`- Password: ${password}`);

    // Check if trigger successfully created the public profile row now
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
