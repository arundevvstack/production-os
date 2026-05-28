import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TimelineEngine {
  /**
   * Shifts the due date of a parent objective by `days` and recursively shifts
   * all dependent objectives by the same amount to preserve timeline margins.
   */
  static async shiftDependencyTimeline(objectiveId: string, daysShifted: number, companyId: string, userId: string) {
    if (daysShifted === 0) return;

    return await prisma.$transaction(async (tx) => {
      // 1. Shift the primary objective
      const primaryObj = await tx.objective.findUnique({ where: { id: objectiveId }});
      if (!primaryObj || !primaryObj.due_date) return;

      const newPrimaryDate = new Date(primaryObj.due_date);
      newPrimaryDate.setDate(newPrimaryDate.getDate() + daysShifted);

      await tx.objective.update({
        where: { id: objectiveId },
        data: { due_date: newPrimaryDate }
      });

      await tx.auditLog.create({
          data: {
              company_id: companyId,
              user_id: userId,
              entity_type: 'Objective',
              entity_id: objectiveId,
              action: 'TIMELINE_SHIFT',
              before_state: { due_date: primaryObj.due_date },
              after_state: { due_date: newPrimaryDate, days_shifted: daysShifted }
          }
      });

      // 2. Fetch all dependent children recursively and shift them
      await this.shiftChildrenRecursive(tx, objectiveId, daysShifted, companyId, userId);

      // (Optional) Shift overall project deadline if critical path exceeded
      // This would require checking if the new dates exceed project.deadline
    });
  }

  private static async shiftChildrenRecursive(tx: any, parentId: string, daysShifted: number, companyId: string, userId: string) {
    // Find dependencies where parentId is blocking childId
    const dependencies = await tx.objectiveDependency.findMany({
      where: { parent_id: parentId, type: 'blocking' }
    });

    for (const dep of dependencies) {
      const childObj = await tx.objective.findUnique({ where: { id: dep.child_id }});
      
      if (childObj && childObj.due_date) {
        const newChildDate = new Date(childObj.due_date);
        newChildDate.setDate(newChildDate.getDate() + daysShifted);

        await tx.objective.update({
          where: { id: childObj.id },
          data: { due_date: newChildDate }
        });

        await tx.auditLog.create({
            data: {
                company_id: companyId,
                user_id: userId,
                entity_type: 'Objective',
                entity_id: childObj.id,
                action: 'TIMELINE_AUTO_SHIFT',
                before_state: { due_date: childObj.due_date },
                after_state: { due_date: newChildDate, reason: `Cascading delay from parent ${parentId}` }
            }
        });

        // Recursively shift grandchildren
        await this.shiftChildrenRecursive(tx, childObj.id, daysShifted, companyId, userId);
      }
    }
  }
}
