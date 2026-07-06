import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { orchestrator } from "@/lib/production/orchestrator/ProductionOrchestrator";
import { EnterpriseAnalytics } from "@/lib/production/engines/EnterpriseAnalytics";
import { ResourceMonitor } from "@/lib/production/engines/ResourceMonitor";
import { CostOptimizer } from "@/lib/production/engines/CostOptimizer";
import { RecoveryEngine } from "@/lib/production/engines/RecoveryEngine";

export const dynamic = 'force-dynamic'; // Prevent caching for live monitor

export async function GET() {
  try {
    const projects = await prisma.project.findMany({ select: { id: true, project_name: true } });
    
    const activeProjects = [];
    let globalCost = 0;
    
    for (const p of projects) {
      // Recovery sweep
      await RecoveryEngine.executeRecovery(p.id);

      const state = orchestrator.getProjectState(p.id);
      const usage = await ResourceMonitor.getProjectUsage(p.id);
      const cost = await CostOptimizer.predictCosts(p.id);
      
      globalCost += cost.current_spend;
      
      activeProjects.push({
        id: p.id,
        name: p.project_name,
        state,
        usage,
        cost
      });
    }

    const analytics = await EnterpriseAnalytics.getGlobalMetrics();

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      projects: activeProjects,
      analytics,
      global_cost: parseFloat(globalCost.toFixed(2))
    });

  } catch (error: any) {
    console.error("Operations State API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
