import prisma from "@/lib/prisma";

export interface TimelineRisk {
  status: "on_track" | "at_risk" | "delayed";
  bottleneck: string | null;
  estimated_completion: Date | null;
}

export class TimelineEngine {
  static async evaluateTimeline(projectId: string): Promise<TimelineRisk> {
    const jobs = await prisma.productionAIJob.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' }
    });

    const pendingJobs = jobs.filter(j => j.status === 'Queued' || j.status === 'Running').length;
    const failedJobs = jobs.filter(j => j.status === 'Failed').length;

    const assets = await prisma.productionAsset.findMany({
      where: { project_id: projectId }
    });

    const pendingReviews = assets.filter(a => a.status === 'Pending Review').length;
    
    let status: "on_track" | "at_risk" | "delayed" = "on_track";
    let bottleneck = null;

    if (failedJobs > (jobs.length * 0.2)) {
      status = "delayed";
      bottleneck = "High AI Job Failure Rate";
    } else if (pendingReviews > 50) {
      status = "at_risk";
      bottleneck = "Human Review Backlog";
    } else if (pendingJobs > 100) {
      status = "at_risk";
      bottleneck = "Generation Queue Overflow";
    }

    // Rough estimation
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + Math.ceil(pendingJobs / 100) + Math.ceil(pendingReviews / 50));

    return {
      status,
      bottleneck,
      estimated_completion: estimatedCompletion
    };
  }
}
