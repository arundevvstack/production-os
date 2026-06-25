import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client with the Service Role Key to bypass RLS for secure uploads
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request, { params }: { params: Promise<{ clientId: string }> }) {
  try {
    const { clientId } = await params;
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file || !type || !['logo', 'wallpaper'].includes(type)) {
      return NextResponse.json({ error: 'Missing file or valid type (logo, wallpaper)' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB.' }, { status: 400 });
    }

    // Convert File to ArrayBuffer for uploading
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}/${type}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Upload to 'avatars' bucket bypassing RLS (using it generically for images)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(`clients/${fileName}`, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('avatars')
      .getPublicUrl(`clients/${fileName}`);

    // Update Client table bypassing RLS
    const updateField = type === 'logo' ? { logo_url: publicUrl } : { wallpaper_url: publicUrl };
    
    const { error: updateError } = await supabaseAdmin
      .from('Client')
      .update(updateField)
      .eq('id', clientId);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, publicUrl });
  } catch (error: any) {
    console.error('[Client Asset Upload API Error]', error);
    return NextResponse.json({ error: error.message || 'Failed to upload asset' }, { status: 500 });
  }
}
