import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProductionHealthEngine } from "@/lib/production/engines/ProductionHealthEngine";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        ProductionAIJob: { select: { id: true, status: true, provider_id: true, metadata: true } },
        ProductionAsset: { select: { id: true, status: true } }
      }
    });

    let totalProjects = projects.length;
    let runningJobs = 0;
    let failedJobs = 0;
    let totalSpent = 0;
    let providerUsage: Record<string, number> = {};
    let activeProjectsData = [];

    for (const project of projects) {
      const health = await ProductionHealthEngine.evaluateProject(project.id);
      
      const pRunning = project.ProductionAIJob.filter(j => j.status === 'Running').length;
      const pFailed = project.ProductionAIJob.filter(j => j.status === 'Failed').length;
      
      runningJobs += pRunning;
      failedJobs += pFailed;

      project.ProductionAIJob.forEach(job => {
         const meta = job.metadata as any || {};
         let cost = meta.cost || 0;
         if (cost === 0 && job.status === 'Completed') {
           if (job.provider_id === 'OpenAI') cost = 0.04;
           if (job.provider_id === 'Runway') cost = 0.20;
           if (job.provider_id === 'Luma') cost = 0.15;
           if (job.provider_id === 'Flux') cost = 0.03;
         }
         totalSpent += cost;
         providerUsage[job.provider_id] = (providerUsage[job.provider_id] || 0) + 1;
      });

      activeProjectsData.push({
        id: project.id,
        name: project.name,
        health: health.overall_score,
        assets: project.ProductionAsset.length,
        jobs: project.ProductionAIJob.length,
        blocked: pFailed > (project.ProductionAIJob.length * 0.2) // Simplified blocked logic
      });
    }

    return NextResponse.json({
      totalProjects,
      runningJobs,
      failedJobs,
      totalSpent: parseFloat(totalSpent.toFixed(2)),
      providerUsage,
      projects: activeProjectsData
    });
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
