import prisma from '@/lib/prisma';
import { notificationService } from './notification.service';

export const dependencyService = {
  /**
   * Registers a dependency block between a parent (blocker) and child (blocked) objective
   */
  async addDependency(parent_id: string, child_id: string) {
    if (parent_id === child_id) {
      throw new Error('An objective cannot depend on itself.');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create dependency link
      const dependency = await tx.objectiveDependency.create({
        data: {
          parent_id,
          child_id
        }
      });

      // 2. Mark child objective as blocked
      await tx.objective.update({
        where: { id: child_id },
        data: {
          is_blocked: true,
          status: 'Blocked'
        }
      });

      return dependency;
    }, {
      timeout: 30000
    });
  },

  /**
   * Removes a dependency link between parent and child objectives
   */
  async removeDependency(parent_id: string, child_id: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Delete link
      await tx.objectiveDependency.delete({
        where: {
          parent_id_child_id: {
            parent_id: parent_id,
            child_id: child_id
          }
        }
      }).catch(() => {
        // Fallback for custom or direct queries
      });

      // 2. Check if the child is still blocked by other parents
      const remainingBlockers = await tx.objectiveDependency.count({
        where: { child_id }
      });

      if (remainingBlockers === 0) {
        // Unlock objective
        await tx.objective.update({
          where: { id: child_id },
          data: {
            is_blocked: false,
            status: 'Pending'
          }
        });
      }
    }, {
      timeout: 30000
    });
  },

  /**
   * Event handler triggered when an objective's status is updated to 'Completed'
   */
  async onObjectiveCompleted(completedObjectiveId: string, companyId: string) {
    // 1. Retrieve all child dependencies where this completed objective was the parent (blocker)
    const dependencies = await prisma.objectiveDependency.findMany({
      where: { parent_id: completedObjectiveId },
      include: {
        child: {
          select: {
            id: true,
            title: true,
            status: true,
            assignee_id: true,
            project_id: true
          }
        }
      }
    });

    if (dependencies.length === 0) {
      return [];
    }

    const unlockedObjectives = [];

    for (const dep of dependencies) {
      const child = dep.child;

      // 2. Check if the child has any other incomplete parent (blocker) objectives
      const incompleteBlockers = await prisma.objectiveDependency.findMany({
        where: {
          child_id: child.id,
          parent: {
            NOT: {
              status: { in: ['Completed', 'Approved'] }
            }
          }
        }
      });

      // If no other incomplete blockers, unlock the child objective!
      if (incompleteBlockers.length === 0) {
        await prisma.$transaction(async (tx) => {
          // Unlock database record
          await tx.objective.update({
            where: { id: child.id },
            data: {
              is_blocked: false,
              status: 'Pending'
            }
          });

          // Delete all completed dependency links to keep table clean (optional, but good practice)
          await tx.objectiveDependency.deleteMany({
            where: { child_id: child.id }
          });
        }, {
          timeout: 30000
        });

        unlockedObjectives.push(child);

        // 3. Send notification to the assignee that their task is unlocked
        if (child.assignee_id) {
          try {
            await notificationService.queueNotification({
              companyId,
              userId: child.assignee_id,
              templateKey: 'SLA_WARNING', // reuse warning layout style or custom string
              payload: {
                taskTitle: child.title
              },
              priority: 'HIGH'
            });
          } catch (notifErr) {
            console.error('Failed to dispatch unlock notification:', notifErr);
          }
        }
      }
    }

    return unlockedObjectives;
  }
};
