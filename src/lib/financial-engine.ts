import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class FinancialEngine {
  /**
   * Recalculates and updates the 'utilized_budget' field on a Project's Budget record
   * based on all active/approved time entries and expenses.
   */
  static async recalculateProjectBudget(projectId: string, averageHourlyLaborCost: number = 50) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch budget record
      const budget = await tx.budget.findUnique({
        where: { project_id: projectId }
      });

      if (!budget) {
        throw new Error(`No budget record found for project ${projectId}`);
      }

      // 2. Calculate Labor Cost
      const objectives = await tx.objective.findMany({
        where: { project_id: projectId },
        select: { id: true }
      });
      const objectiveIds = objectives.map(o => o.id);

      const timeEntries = await tx.timeEntry.aggregate({
        where: {
          objective_id: { in: objectiveIds },
          approval_status: 'approved'
        },
        _sum: { duration_sec: true }
      });

      const totalHours = (timeEntries._sum.duration_sec || 0) / 3600;
      const laborCost = totalHours * averageHourlyLaborCost;

      // 3. Calculate External / Hardware Expenses
      const expenses = await tx.expense.aggregate({
        where: { project_id: projectId, status: 'approved' },
        _sum: { amount: true }
      });
      const externalCost = expenses._sum.amount || 0;

      // 4. Calculate AI Costs
      const aiJobs = await tx.aIGenerationJob.aggregate({
        where: { project_id: projectId, status: 'completed' },
        _sum: { cost_credits: true }
      });
      const aiCost = aiJobs._sum.cost_credits || 0;

      // 5. Compute Utilization
      const totalUtilized = laborCost + externalCost + aiCost;

      // 6. Update Budget Record
      const updatedBudget = await tx.budget.update({
        where: { project_id: projectId },
        data: {
          utilized_budget: totalUtilized
        }
      });

      const burnRate = (totalUtilized / budget.approved_budget) * 100;

      // 7. Optional: Fire Warning if over budget
      if (burnRate >= 90) {
        await this.fireBudgetWarning(tx, projectId, burnRate);
      }

      return {
        projectId,
        laborCost,
        externalCost,
        aiCost,
        totalUtilized,
        approvedBudget: budget.approved_budget,
        burnRatePercent: Math.round(burnRate * 100) / 100
      };
    });
  }

  private static async fireBudgetWarning(tx: any, projectId: string, burnRate: number) {
    const project = await tx.project.findUnique({
      where: { id: projectId },
      select: { company_id: true, project_name: true }
    });

    if (!project) return;

    const pm = await tx.projectMember.findFirst({
      where: { project_id: projectId, role: 'Project Manager' },
      select: { user_id: true }
    });

    if (pm) {
      await tx.notificationQueue.create({
        data: {
          company_id: project.company_id,
          user_id: pm.user_id,
          channel: 'IN_APP',
          title: 'Budget Alert',
          body: `Project "${project.project_name}" has reached ${burnRate.toFixed(1)}% of its approved budget.`,
          priority: 'HIGH'
        }
      });
    }
  }
}
