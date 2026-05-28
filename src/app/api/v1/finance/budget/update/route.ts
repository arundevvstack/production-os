import { NextResponse } from 'next/server';
import { FinancialEngine } from '@/lib/financial-engine';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { project_id } = body;

    if (!project_id) {
      return NextResponse.json({ error: 'Missing project_id' }, { status: 400 });
    }

    // Auth verification
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }});
    const isManager = dbUser?.role_id === 'SUPER_ADMIN' || dbUser?.role_id === 'ADMIN' || dbUser?.role_id === 'PROJECT_MANAGER';

    if (!isManager) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Call engine
    const stats = await FinancialEngine.recalculateProjectBudget(project_id);

    return NextResponse.json({ success: true, data: stats });

  } catch (error: any) {
    console.error("Budget Update Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update budget" }, { status: 500 });
  }
}
