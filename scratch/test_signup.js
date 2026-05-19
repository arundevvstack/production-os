const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const testEmail = `signup-test-${Date.now()}@dpstudios.com`;
  const testPassword = "SuperSecurePassword123!";

  console.log(`Executing real Supabase signup test for: ${testEmail}...`);

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
    options: {
      data: {
        full_name: "Integration Test User"
      }
    }
  });

  if (error) {
    console.error("❌ Signup Failed with GoTrue/Supabase Error:");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
    console.error("Full Error Object:", JSON.stringify(error, null, 2));
  } else {
    console.log("✔ Signup Succeeded completely!");
    console.log("User Auth ID:", data.user?.id);
    console.log("Session details:", data.session);
  }
}

main();
