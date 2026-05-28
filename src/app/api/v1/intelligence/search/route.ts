import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { vectorStore } from '@/lib/vector-provider';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required.' }, { status: 400 });
    }

    // 1. Semantic Search across all vectorized entities (Projects, Assets, Prompts)
    const results = await vectorStore.searchSimilar(query, 10);

    return NextResponse.json({ 
        success: true, 
        query,
        results: results 
    });

  } catch (error: any) {
    console.error("Semantic Search Error:", error);
    return NextResponse.json({ error: error.message || "Search failed" }, { status: 500 });
  }
}
