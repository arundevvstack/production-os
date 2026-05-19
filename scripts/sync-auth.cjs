const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const prisma = new PrismaClient();

async function syncUsers() {
  const migratedUsers = await prisma.user.findMany();

  for (const user of migratedUsers) {
    if (user.id.includes('-')) {
        console.log(`User ${user.email} already has a UUID. Skipping.`);
        continue;
    }

    console.log(`Syncing user: ${user.email}`);
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: "password123",
      email_confirm: true
    });

    if (authError) {
      console.log(`Auth Creation Error for ${user.email}: ${authError.message}`);
      // Try to find the user in Supabase anyway
      const { data: listData } = await supabase.auth.admin.listUsers();
      const found = listData.users.find(u => u.email === user.email);
      if (found) {
        console.log(`Found existing user ${user.email} with ID ${found.id}. Updating profile...`);
        await updateUserId(user.id, found.id);
      } else {
        console.error(`Could not create or find user ${user.email}`);
      }
    } else if (authData?.user) {
      console.log(`Successfully created user ${user.email} in Supabase Auth. Updating profile ID...`);
      await updateUserId(user.id, authData.user.id);
    }
  }
}

async function updateUserId(oldId, newId) {
  console.log(`Mapping old ID ${oldId} to new UUID ${newId}`);
  
  const oldUser = await prisma.user.findUnique({ where: { id: oldId } });
  if (!oldUser) {
      console.log('Old user record not found. Might have been updated already.');
      return;
  }

  await prisma.user.delete({ where: { id: oldId } });
  
  await prisma.user.create({
    data: {
      ...oldUser,
      id: newId
    }
  });

  console.log(`ID successfully migrated for ${oldUser.email}`);
}

syncUsers();
