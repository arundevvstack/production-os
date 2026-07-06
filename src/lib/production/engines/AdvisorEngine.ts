import prisma from "@/lib/prisma";
import { ProductionHealthEngine } from "./ProductionHealthEngine";
import { TimelineEngine } from "./TimelineEngine";
import { ContinuityEngine } from "./ContinuityEngine";
import { BudgetEngine } from "./BudgetEngine";

export interface AIRecommendation {
  type: "warning" | "optimization" | "action";
  message: string;
  context?: any;
}

export class AdvisorEngine {
  static async generateAdvice(projectId: string): Promise<AIRecommendation[]> {
    const advice: AIRecommendation[] = [];

    // Run parallel evaluations
    const [health, timeline, continuity, budget] = await Promise.all([
      ProductionHealthEngine.evaluateProject(projectId),
      TimelineEngine.evaluateTimeline(projectId),
      ContinuityEngine.evaluateContinuity(projectId),
      BudgetEngine.evaluateBudget(projectId)
    ]);

    // 1. Health Advice
    if (health.metrics.prompts < 50 && health.metrics.shots > 0) {
      advice.push({
        type: "action",
        message: "You have un-prompted shots. Generate prompts to unblock production."
      });
    }

    // 2. Timeline Advice
    if (timeline.bottleneck === "Human Review Backlog") {
      advice.push({
        type: "warning",
        message: "Your Human Review queue is overflowing. Assign reviewers to clear the backlog before generating more assets."
      });
    }

    // 3. Continuity Advice
    if (continuity.length > 0) {
      advice.push({
        type: "warning",
        message: `Detected ${continuity.length} continuity issues (e.g., ${continuity[0].category}). Check the Compare tool.`
      });
    }

    // 4. Budget Advice
    if (budget.risk_level !== "low") {
      advice.push({
        type: "optimization",
        message: "Budget risk is elevated. Consider switching some assets to a lower cost provider (e.g., Flux instead of Midjourney/DALL-E) to conserve resources."
      });
    }
    
    // Check if everything is perfect
    if (advice.length === 0) {
       advice.push({
        type: "optimization",
        message: "Production is running smoothly. No critical bottlenecks detected."
      });
    }

    return advice;
  }
}
