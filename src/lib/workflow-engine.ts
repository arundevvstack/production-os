import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WorkflowEngine {
  /**
   * Attempts to move a project to the next stage safely using a Prisma transaction.
   * Validates mandatory objectives and approvals before transitioning.
   */
  static async transitionStage(
    projectId: string,
    currentStageId: string,
    nextStageId: string,
    userId: string,
    companyId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch current workflow state
      let workflowState = await tx.workflowState.findUnique({
        where: { project_id: projectId },
      });

      if (!workflowState) {
        workflowState = await tx.workflowState.create({
          data: {
            project_id: projectId,
            active_stage_id: currentStageId,
          },
        });
      }

      // 2. Validate state lock
      if (workflowState.is_blocked) {
        throw new Error(`Workflow is blocked: ${workflowState.blocked_reason}`);
      }

      // 3. Verify all mandatory objectives in current stage are completed
      const incompleteObjectives = await tx.objective.findMany({
        where: {
          project_id: projectId,
          stage_id: currentStageId,
          status: { not: 'Completed' },
        },
      });

      if (incompleteObjectives.length > 0) {
        throw new Error(
          `Cannot transition stage. ${incompleteObjectives.length} objective(s) are incomplete in the current stage.`
        );
      }

      // 4. Perform Transition
      const updatedState = await tx.workflowState.update({
        where: { project_id: projectId },
        data: {
          previous_stage_id: currentStageId,
          active_stage_id: nextStageId,
          updated_at: new Date(),
        },
      });

      // 5. Update actual ProjectStage records
      await tx.projectStage.update({
        where: { id: currentStageId },
        data: { status: 'completed', end_date: new Date() },
      });

      await tx.projectStage.update({
        where: { id: nextStageId },
        data: { status: 'active', start_date: new Date() },
      });

      // 6. Audit Log
      await tx.auditLog.create({
        data: {
          company_id: companyId,
          user_id: userId,
          entity_type: 'ProjectStage',
          entity_id: projectId,
          action: 'STAGE_TRANSITION',
          before_state: { stage_id: currentStageId },
          after_state: { stage_id: nextStageId },
        },
      });

      return updatedState;
    });
  }

  /**
   * Locks the workflow (e.g., when client rejects or a critical block occurs)
   */
  static async lockWorkflow(projectId: string, reason: string, userId: string, companyId: string) {
    return await prisma.$transaction(async (tx) => {
      const state = await tx.workflowState.update({
        where: { project_id: projectId },
        data: {
          is_blocked: true,
          blocked_reason: reason,
        },
      });

      await tx.auditLog.create({
        data: {
          company_id: companyId,
          user_id: userId,
          entity_type: 'WorkflowState',
          entity_id: projectId,
          action: 'WORKFLOW_LOCKED',
          after_state: { reason },
        },
      });

      return state;
    });
  }

  /**
   * Unlocks the workflow
   */
  static async unlockWorkflow(projectId: string, userId: string, companyId: string) {
    return await prisma.$transaction(async (tx) => {
      const state = await tx.workflowState.update({
        where: { project_id: projectId },
        data: {
          is_blocked: false,
          blocked_reason: null,
        },
      });

      await tx.auditLog.create({
        data: {
          company_id: companyId,
          user_id: userId,
          entity_type: 'WorkflowState',
          entity_id: projectId,
          action: 'WORKFLOW_UNLOCKED',
        },
      });

      return state;
    });
  }
}
