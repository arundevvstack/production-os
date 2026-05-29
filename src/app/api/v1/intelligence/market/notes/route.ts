import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Profile
    const { data: profile } = await supabase
      .from('User')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company association found' }, { status: 403 });
    }
    const companyId = profile.company_id;

    // 3. Parse input
    const body = await request.json();
    const content = body.content;

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Missing content string' }, { status: 400 });
    }

    // 4. Upsert Note
    // For simplicity, we keep a single shared note per company for the "Collaborative Notes" feature.
    // If multiple notes are needed, we would need a noteId.
    const existingNote = await prisma.marketResearchNote.findFirst({
      where: { company_id: companyId }
    });

    if (existingNote) {
      const updatedNote = await prisma.marketResearchNote.update({
        where: { id: existingNote.id },
        data: { content, user_id: user.id } // track last updater
      });
      return NextResponse.json({ success: true, note: updatedNote });
    } else {
      const newNote = await prisma.marketResearchNote.create({
        data: {
          company_id: companyId,
          user_id: user.id,
          content
        }
      });
      return NextResponse.json({ success: true, note: newNote });
    }

  } catch (error: any) {
    console.error('[Market Notes API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save note' },
      { status: 500 }
    );
  }
}
