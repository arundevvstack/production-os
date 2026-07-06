import prisma from "@/lib/prisma";

export class EnterpriseAnalytics {
  /**
   * Aggregates historical KPI metrics across all productions.
   */
  static async getGlobalMetrics() {
    const jobs = await prisma.productionAIJob.findMany({
       select: { status: true, provider_id: true, created_at: true, completed_at: true }
    });

    const assets = await prisma.productionAsset.findMany({
       select: { status: true, created_at: true, updated_at: true }
    });

    const totalJobs = jobs.length;
    const failedJobs = jobs.filter(j => j.status === 'Failed').length;
    const failureRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;

    let totalDuration = 0;
    let completedCount = 0;
    jobs.forEach(j => {
      if (j.status === 'Completed' && j.completed_at && j.created_at) {
         totalDuration += (j.completed_at.getTime() - j.created_at.getTime());
         completedCount++;
      }
    });

    const avgGenerationDurationMs = completedCount > 0 ? (totalDuration / completedCount) : 0;

    const approvedAssets = assets.filter(a => a.status === 'Approved').length;
    const reviewEfficiency = assets.length > 0 ? (approvedAssets / assets.length) * 100 : 0;

    return {
       historical: {
          production_velocity: completedCount, // Jobs completed
          failure_rate_pct: parseFloat(failureRate.toFixed(2)),
          avg_generation_duration_sec: parseFloat((avgGenerationDurationMs / 1000).toFixed(2)),
          review_efficiency_pct: parseFloat(reviewEfficiency.toFixed(2)),
          quality_trend: "Stable" // Mock trend
       }
    };
  }
}
