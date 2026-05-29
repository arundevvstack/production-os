import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client with the Service Role Key to bypass RLS for secure uploads
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const uid = formData.get('uid') as string | null;

    if (!file || !uid) {
      return NextResponse.json({ error: 'Missing file or user ID' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 2MB.' }, { status: 400 });
    }

    // Convert File to ArrayBuffer for uploading
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileExt = file.name.split('.').pop();
    const fileName = `${uid}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${uid}/${fileName}`;

    // Upload to 'avatars' bucket bypassing RLS
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update User profile table bypassing RLS
    const { error: updateError } = await supabaseAdmin
      .from('User')
      .update({ avatar: publicUrl })
      .eq('id', uid);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, publicUrl });
  } catch (error: any) {
    console.error('[Avatar Upload API Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to upload avatar' }, { status: 500 });
  }
}
