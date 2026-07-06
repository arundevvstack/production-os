import prisma from "@/lib/prisma";

export interface BudgetStatus {
  total_spent: number;
  currency: string;
  provider_breakdown: Record<string, number>;
  risk_level: "low" | "medium" | "high";
}

export class BudgetEngine {
  static async evaluateBudget(projectId: string): Promise<BudgetStatus> {
    const jobs = await prisma.productionAIJob.findMany({
      where: { project_id: projectId, status: 'Completed' }
    });

    let total_spent = 0;
    const provider_breakdown: Record<string, number> = {};

    jobs.forEach(job => {
      // Typically, cost would be calculated based on tokens or duration from metadata
      // For this implementation, we simulate average costs per provider model
      const meta = job.metadata as any || {};
      let jobCost = meta.cost || 0;
      
      if (jobCost === 0) {
        // Fallbacks for prototype
        if (job.provider_id === 'OpenAI') jobCost = 0.04;
        if (job.provider_id === 'Runway') jobCost = 0.20;
        if (job.provider_id === 'Luma') jobCost = 0.15;
        if (job.provider_id === 'Flux') jobCost = 0.03;
      }

      total_spent += jobCost;
      provider_breakdown[job.provider_id] = (provider_breakdown[job.provider_id] || 0) + jobCost;
    });

    let risk_level: "low" | "medium" | "high" = "low";
    if (total_spent > 1000) risk_level = "medium";
    if (total_spent > 5000) risk_level = "high";

    return {
      total_spent: parseFloat(total_spent.toFixed(2)),
      currency: "USD",
      provider_breakdown,
      risk_level
    };
  }
}
