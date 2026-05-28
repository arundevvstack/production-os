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
    
    if (dbUser?.role_id !== 'SUPER_ADMIN' && dbUser?.role_id !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Executive access required.' }, { status: 403 });
    }

    // 1. Production Health Stats
    const activeProjects = await prisma.project.count({ where: { status: 'active', company_id: dbUser.company_id || '' }});
    const blockedProjects = await prisma.workflowState.count({ where: { is_blocked: true, project: { company_id: dbUser.company_id || '' } }});

    // 2. Financial Overview
    const budgets = await prisma.budget.aggregate({
        where: { project: { company_id: dbUser.company_id || '' } },
        _sum: { estimated_cost: true, utilized_budget: true }
    });

    // 3. Delivery Success Rate (Mock calculation based on objectives)
    const completedObjectives = await prisma.objective.count({ where: { status: 'Completed', project: { company_id: dbUser.company_id || '' } }});
    const totalObjectives = await prisma.objective.count({ where: { project: { company_id: dbUser.company_id || '' } }});
    const efficiencyRate = totalObjectives > 0 ? (completedObjectives / totalObjectives) * 100 : 0;

    return NextResponse.json({ 
        success: true, 
        data: {
            active_projects: activeProjects,
            blocked_projects: blockedProjects,
            total_budget_utilized: budgets._sum.utilized_budget || 0,
            production_efficiency_rate: Math.round(efficiencyRate)
        }
    });

  } catch (error: any) {
    console.error("Executive Reporting Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 });
  }
}
