import prisma from "@/lib/prisma";

export interface ProviderRecommendation {
  provider_id: string;
  reason: string;
  estimated_latency: number;
}

export class ProviderBalancer {
  /**
   * Evaluates historical job success rates and queue depths to recommend a provider.
   */
  static async recommendProvider(assetType: string): Promise<ProviderRecommendation> {
    const providers = await prisma.productionAIProvider.findMany({
      where: { is_enabled: true, status: 'active' }
    });

    const validProviders = providers.filter(p => p.supported_asset_types.includes(assetType));
    if (validProviders.length === 0) throw new Error(`No active providers for ${assetType}`);

    let bestProvider = validProviders[0].id;
    let bestScore = -1;

    for (const provider of validProviders) {
      // Simplistic load balancing score based on running jobs (lower is better)
      const queueDepth = await prisma.productionAIJob.count({
        where: { provider_id: provider.id, status: 'Running' }
      });
      
      const successJobs = await prisma.productionAIJob.count({
        where: { provider_id: provider.id, status: 'Completed' }
      });
      
      const failedJobs = await prisma.productionAIJob.count({
        where: { provider_id: provider.id, status: 'Failed' }
      });

      const total = successJobs + failedJobs;
      const successRate = total > 0 ? (successJobs / total) : 1;

      // Higher score is better: Success rate weighted against current queue
      const score = (successRate * 100) - (queueDepth * 5);
      
      if (score > bestScore) {
        bestScore = score;
        bestProvider = provider.id;
      }
    }

    return {
      provider_id: bestProvider,
      reason: "Optimal balance of success rate and current queue depth.",
      estimated_latency: Math.floor(Math.random() * 15) + 5 // mock latency in seconds
    };
  }
}
