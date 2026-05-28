import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class HealthEngine {
  /**
   * Calculates a dynamic 0-100 health score predicting the likelihood
   * of the project being delivered on time and on budget.
   */
  static async calculateProjectHealth(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        budget_tracking: true,
        workflow_state: true,
        objectives: true
      }
    });

    if (!project) throw new Error('Project not found');

    let deliveryConfidence = 100;
    let budgetRisk = 0;
    let burnoutRisk = 0;
    const aiRecommendations: any[] = [];

    // 1. Budget Risk Penalty
    if (project.budget_tracking) {
      const burnRate = project.budget_tracking.utilized_budget / project.budget_tracking.approved_budget;
      if (burnRate > 1.0) {
        budgetRisk = 100;
        deliveryConfidence -= 30;
        aiRecommendations.push({ type: 'ESCALATE_FINANCE', message: 'Project has exceeded budget. Pause external vendors.' });
      } else if (burnRate > 0.8) {
        budgetRisk = 60;
        deliveryConfidence -= 10;
        aiRecommendations.push({ type: 'WARNING', message: 'Budget is at 80% utilization. Restrict AI rendering.' });
      }
    }

    // 2. Schedule & Workflow Penalty
    if (project.workflow_state?.is_blocked) {
      deliveryConfidence -= 25;
      aiRecommendations.push({ type: 'WORKFLOW_BLOCKED', message: `Workflow blocked at stage ${project.workflow_state.active_stage_id}` });
    }

    // 3. Burnout Risk (Too many overdue objectives)
    const overdueObjectives = project.objectives.filter(o => 
      o.target_date && new Date(o.target_date) < new Date() && o.status !== 'Completed'
    );
    
    if (overdueObjectives.length > 5) {
      burnoutRisk = 80;
      deliveryConfidence -= 20;
      aiRecommendations.push({ type: 'REASSIGN_LOAD', message: 'Team is overloaded. Reassign tasks or extend deadline.' });
    }

    // 4. Bound Confidence
    deliveryConfidence = Math.max(0, Math.min(100, deliveryConfidence));

    // 5. Save Score
    return await prisma.projectHealthScore.upsert({
      where: { project_id: projectId },
      update: {
        delivery_confidence: deliveryConfidence,
        budget_risk_score: budgetRisk,
        burnout_risk_score: burnoutRisk,
        ai_recommendations: aiRecommendations,
        last_calculated_at: new Date()
      },
      create: {
        project_id: projectId,
        delivery_confidence: deliveryConfidence,
        budget_risk_score: budgetRisk,
        burnout_risk_score: burnoutRisk,
        ai_recommendations: aiRecommendations
      }
    });
  }
}
