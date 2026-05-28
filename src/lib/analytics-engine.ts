import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsEngine {
  /**
   * Calculates the utilization rate of a specific user.
   * Utilization = (Billable Hours / Capacity Hours) * 100
   */
  static async calculateUserUtilization(userId: string, startDate: Date, endDate: Date) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { capacity_hours: true }
    });

    if (!user) throw new Error("User not found");

    const capacitySecs = (user.capacity_hours || 40) * 3600;

    const timeEntries = await prisma.timeEntry.aggregate({
      where: {
        user_id: userId,
        is_billable: true,
        approval_status: 'approved',
        start_time: { gte: startDate, lte: endDate }
      },
      _sum: { duration_sec: true }
    });

    const billableSecs = timeEntries._sum.duration_sec || 0;
    const utilizationRate = capacitySecs > 0 ? (billableSecs / capacitySecs) * 100 : 0;

    return {
      userId,
      capacitySecs,
      billableSecs,
      utilizationRate: Math.round(utilizationRate * 100) / 100
    };
  }

  /**
   * Calculates the profitability of a project based on logged hours and fixed budget.
   * Assume an average hourly cost of $50 for this calculation logic.
   */
  static async calculateProjectProfitability(projectId: string, averageHourlyCost: number = 50) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { budget: true }
    });

    if (!project) throw new Error("Project not found");

    // Get all approved time entries linked to objectives of this project
    const objectives = await prisma.objective.findMany({
      where: { project_id: projectId },
      select: { id: true }
    });
    const objectiveIds = objectives.map(o => o.id);

    const timeEntries = await prisma.timeEntry.aggregate({
      where: {
        objective_id: { in: objectiveIds },
        approval_status: 'approved'
      },
      _sum: { duration_sec: true }
    });

    const totalSeconds = timeEntries._sum.duration_sec || 0;
    const totalHours = totalSeconds / 3600;
    const laborCost = totalHours * averageHourlyCost;

    // Get material/external expenses
    const expenses = await prisma.expense.aggregate({
      where: { project_id: projectId },
      _sum: { amount: true }
    });
    const externalCost = expenses._sum.amount || 0;

    const totalCost = laborCost + externalCost;
    const revenue = project.budget;
    const profit = revenue - totalCost;
    const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      projectId,
      revenue,
      laborCost,
      externalCost,
      totalCost,
      profit,
      profitMargin: Math.round(profitMargin * 100) / 100
    };
  }
}
