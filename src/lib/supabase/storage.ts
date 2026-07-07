import { createClient } from "@supabase/supabase-js";

// Uses the service role key to bypass RLS for server-side uploads
export const getSupabaseServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase URL or Service Role Key");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function uploadToSupabaseStorage(
  bucketName: string,
  filePath: string,
  buffer: ArrayBuffer,
  contentType: string = "image/png"
): Promise<string> {
  const supabase = getSupabaseServerClient();
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicData.publicUrl;
}
