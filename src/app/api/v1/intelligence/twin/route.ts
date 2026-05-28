import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }});
    
    // Only SUPER_ADMIN and ADMIN (Executives) should access the global Digital Twin
    if (dbUser?.role_id !== 'SUPER_ADMIN' && dbUser?.role_id !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Executive access required.' }, { status: 403 });
    }

    const companyId = dbUser.company_id || '';

    // 1. Organization Health & Risk Zones
    const projectHealths = await prisma.projectHealthScore.findMany({
        where: { project: { company_id: companyId } },
        include: { project: { select: { project_name: true, status: true } } }
    });
    
    const atRiskProjects = projectHealths.filter(p => p.delivery_confidence < 75);

    // 2. Financial Overview (Global Profitability Forecasts)
    const budgets = await prisma.budget.aggregate({
        where: { project: { company_id: companyId, status: 'active' } },
        _sum: { estimated_cost: true, approved_budget: true, utilized_budget: true }
    });

    // 3. AI Infrastructure Load (Current billing cycle usage)
    const subscription = await prisma.tenantSubscription.findUnique({
        where: { company_id: companyId }
    });

    const aiJobs = await prisma.aIGenerationJob.aggregate({
        where: { project: { company_id: companyId } },
        _sum: { cost_credits: true },
        _count: { id: true }
    });

    // 4. Telemetry Highlights (Last 7 Days)
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const telemetry = await prisma.operationalTelemetry.groupBy({
        by: ['metric_type'],
        where: { company_id: companyId, timestamp: { gte: lastWeek } },
        _avg: { metric_value: true },
        _count: { id: true }
    });

    return NextResponse.json({ 
        success: true, 
        data: {
            organizational_health: {
                total_active_projects: projectHealths.length,
                at_risk_projects: atRiskProjects.length,
                risk_zones: atRiskProjects.map(p => ({
                    name: p.project.project_name,
                    confidence: p.delivery_confidence,
                    issues: p.ai_recommendations
                }))
            },
            financial_forecast: {
                total_approved_budget: budgets._sum.approved_budget || 0,
                total_utilized_budget: budgets._sum.utilized_budget || 0,
                estimated_completion_cost: budgets._sum.estimated_cost || 0
            },
            ai_infrastructure_load: {
                total_jobs_run: aiJobs._count.id,
                total_ai_spend: aiJobs._sum.cost_credits || 0,
                monthly_ai_limit: subscription?.ai_usage_limit || 0
            },
            telemetry_averages: telemetry
        }
    });

  } catch (error: any) {
    console.error("Digital Twin API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate digital twin" }, { status: 500 });
  }
}
