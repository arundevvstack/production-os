import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Profile & Role
    const { data: profile } = await supabase
      .from('User')
      .select('company_id, role_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company association found' }, { status: 403 });
    }

    // 3. RBAC Check
    const allowedRoles = ['SUPER_ADMIN', 'MANAGER', 'MARKETING_SALES'];
    if (!allowedRoles.includes(profile.role_id ?? '')) {
      return NextResponse.json(
        { error: 'Market Intelligence requires SUPER_ADMIN, MANAGER, or MARKETING_SALES role' },
        { status: 403 }
      );
    }

    const companyId = profile.company_id;

    // 4. Fetch all data via Prisma
    const [gaps, leads, competitors, trends, alerts, notes] = await Promise.all([
      prisma.marketOpportunity.findMany({
        where: { company_id: companyId },
        orderBy: { impact_score: 'desc' },
        take: 10,
      }),
      prisma.marketLead.findMany({
        where: { company_id: companyId },
        include: { scores: true },
        orderBy: { opportunity_score: 'desc' },
        take: 20,
      }),
      prisma.competitor.findMany({
        where: { company_id: companyId },
        include: { activities: { orderBy: { detected_at: 'desc' }, take: 5 } },
      }),
      prisma.industryTrend.findMany({
        where: { company_id: companyId },
        orderBy: { velocity_score: 'desc' },
      }),
      prisma.marketAlert.findMany({
        where: { company_id: companyId, is_dismissed: false },
        orderBy: { created_at: 'desc' },
        take: 10,
      }),
      prisma.marketResearchNote.findMany({
        where: { company_id: companyId },
        orderBy: { updated_at: 'desc' },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      gaps,
      leads,
      competitors,
      trends,
      alerts,
      notes,
    });
  } catch (error: any) {
    console.error('[Market Dashboard API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
