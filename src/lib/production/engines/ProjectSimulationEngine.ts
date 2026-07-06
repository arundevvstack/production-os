import prisma from "@/lib/prisma";
import { TimelineEngine } from "../engines/TimelineEngine";
import { BudgetEngine } from "../engines/BudgetEngine";

export class ProjectSimulationEngine {
  /**
   * Evaluates "What If" scenarios without mutating the database.
   */
  static async simulateScenario(projectId: string, scenario: {
    provider_switch?: string;
    remove_scenes_count?: number;
    budget_decrease_pct?: number;
    approval_delay_days?: number;
  }) {
    // Fetch current state
    const budget = await BudgetEngine.evaluateBudget(projectId);
    const timeline = await TimelineEngine.evaluateTimeline(projectId);

    // Deep copy baseline
    let projectedTimeline = new Date(timeline.estimated_completion || new Date());
    let projectedBudget = budget.total_spent;
    let risk = "Low";
    const insights = [];

    if (scenario.provider_switch) {
       insights.push(`Switching to ${scenario.provider_switch} reduces average asset generation time but may affect consistency.`);
       // Simulate a 20% cost change
       if (scenario.provider_switch === 'Flux') projectedBudget *= 0.5;
       if (scenario.provider_switch === 'Runway') projectedBudget *= 1.5;
    }

    if (scenario.remove_scenes_count) {
       insights.push(`Removing ${scenario.remove_scenes_count} scenes saves an estimated $${(scenario.remove_scenes_count * 5).toFixed(2)}.`);
       projectedBudget = Math.max(0, projectedBudget - (scenario.remove_scenes_count * 5));
    }

    if (scenario.approval_delay_days) {
       insights.push(`A ${scenario.approval_delay_days}-day delay in approvals pushes final delivery to ${new Date(projectedTimeline.getTime() + (scenario.approval_delay_days * 86400000)).toLocaleDateString()}.`);
       projectedTimeline = new Date(projectedTimeline.getTime() + (scenario.approval_delay_days * 86400000));
       risk = "High";
    }

    if (scenario.budget_decrease_pct) {
       insights.push(`Decreasing budget by ${scenario.budget_decrease_pct}% leaves only $${(budget.total_spent * (1 - scenario.budget_decrease_pct / 100)).toFixed(2)} remaining. Provider switch is mandatory.`);
       risk = "Critical";
    }

    return {
      projected_timeline: projectedTimeline,
      projected_cost: parseFloat(projectedBudget.toFixed(2)),
      projected_risk: risk,
      insights
    };
  }
}
