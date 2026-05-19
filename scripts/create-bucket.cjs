const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createBucket() {
  const { data, error } = await supabase.storage.createBucket('avatars', {
    public: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif'],
    fileSizeLimit: 2097152 // 2MB
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket "avatars" already exists.');
    } else {
      console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Bucket "avatars" created successfully.');
  }
}

createBucket();
