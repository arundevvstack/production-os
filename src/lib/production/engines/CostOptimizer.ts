import prisma from "@/lib/prisma";
import { BudgetEngine } from "./BudgetEngine";

export class CostOptimizer {
  static async predictCosts(projectId: string) {
    const budget = await BudgetEngine.evaluateBudget(projectId);
    
    // Extrapolate: If we have spent X on Y assets, predicting remaining
    const assets = await prisma.productionAsset.count({ where: { project_id: projectId } });
    
    // Mock target for an enterprise production
    const expectedAssets = 500;
    
    let costPerAsset = assets > 0 ? (budget.total_spent / assets) : 0.05;
    let projectedRemaining = Math.max(0, expectedAssets - assets) * costPerAsset;

    let recommendation = null;
    if (costPerAsset > 0.15) {
      recommendation = "Cost per asset is extremely high. Consider routing background plates to a lower-cost tier provider.";
    }

    return {
      current_spend: budget.total_spent,
      cost_per_asset: parseFloat(costPerAsset.toFixed(3)),
      projected_remaining: parseFloat(projectedRemaining.toFixed(2)),
      recommendation
    };
  }
}
