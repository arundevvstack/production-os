import prisma from '@/lib/prisma';

export interface ApprovalChainStage {
  step: number;
  approver_role: string;
  sla_hours: number;
}

export const approvalService = {
  /**
   * Defines a new reusable approval chain for target records
   */
  async createApprovalChain(companyId: string, name: string, targetType: string, stages: ApprovalChainStage[]) {
    // Sort stages by step order to ensure sequential integrity
    const sortedStages = [...stages].sort((a, b) => a.step - b.step);

    return prisma.approvalChain.create({
      data: {
        company_id: companyId,
        name,
        target_type: targetType,
        stages: sortedStages as any
      }
    });
  },

  /**
   * Submits a target record to an approval chain
   */
  async submitForApproval({
    chainId,
    companyId,
    entityId,
    actorId,
    comment
  }: {
    chainId: string;
    companyId: string;
    entityId: string;
    actorId: string;
    comment?: string;
  }) {
    const chain = await prisma.approvalChain.findUnique({
      where: { id: chainId }
    });

    if (!chain) {
      throw new Error('Approval chain configuration not found.');
    }

    const stages = chain.stages as any;
    const firstStage = Array.isArray(stages) && stages.length > 0 ? stages[0] as ApprovalChainStage : null;

    if (!firstStage) {
      throw new Error('Approval chain has no stages configured.');
    }

    // Calculate SLA due date for the first stage
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + (firstStage.sla_hours || 24));

    return prisma.$transaction(async (tx) => {
      // 1. Create ApprovalRequest
      const request = await tx.approvalRequest.create({
        data: {
          chain_id: chainId,
          company_id: companyId,
          entity_id: entityId,
          status: 'pending',
          current_step: 1,
          due_date: dueDate
        }
      });

      // 2. Log initial submit history
      await tx.approvalHistory.create({
        data: {
          request_id: request.id,
          step: 1,
          actor_id: actorId,
          action: 'commented',
          comment: comment || 'Submitted for approval.'
        }
      });

      return request;
    }, {
      timeout: 30000
    });
  },

  /**
   * Process an approval stage action (approve/reject/comment)
   */
  async evaluateApproval({
    requestId,
    actorId,
    action,
    comment
  }: {
    requestId: string;
    actorId: string;
    action: 'approved' | 'rejected';
    comment?: string;
  }) {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: requestId },
      include: { chain: true }
    });

    if (!request) {
      throw new Error('Approval request not found.');
    }

    if (request.status !== 'pending' && request.status !== 'escalated') {
      throw new Error(`Cannot process request. Status is currently: ${request.status}`);
    }

    const chain = request.chain;
    const stages = chain.stages as any;
    const currentStepNum = request.current_step;

    if (!Array.isArray(stages) || stages.length === 0) {
      throw new Error('Approval chain contains no stages.');
    }

    const currentStage = stages.find((s: any) => s.step === currentStepNum) as ApprovalChainStage;
    const nextStage = stages.find((s: any) => s.step === currentStepNum + 1) as ApprovalChainStage;

    return prisma.$transaction(async (tx) => {
      // 1. Log evaluation in history
      await tx.approvalHistory.create({
        data: {
          request_id: request.id,
          step: currentStepNum,
          actor_id: actorId,
          action,
          comment
        }
      });

      if (action === 'rejected') {
        // Halt chain on rejection
        const updatedRequest = await tx.approvalRequest.update({
          where: { id: request.id },
          data: {
            status: 'rejected',
            due_date: null
          }
        });

        // Trigger rollback actions or status changes downstream if needed
        return updatedRequest;
      }

      // If approved, check if there is a next stage
      if (nextStage) {
        // Advance to next step
        const nextDueDate = new Date();
        nextDueDate.setHours(nextDueDate.getHours() + (nextStage.sla_hours || 24));

        return tx.approvalRequest.update({
          where: { id: request.id },
          data: {
            current_step: currentStepNum + 1,
            status: 'pending',
            due_date: nextDueDate
          }
        });
      } else {
        // Last stage approved: Complete request
        return tx.approvalRequest.update({
          where: { id: request.id },
          data: {
            status: 'approved',
            due_date: null
          }
        });
      }
    }, {
      timeout: 30000
    });
  },

  /**
   * Retrieves active approval requests pending action
   */
  async getPendingRequests(companyId: string, userRoleId: string) {
    // Load requests where the current stage matches the user's role
    const activeChains = await prisma.approvalChain.findMany({
      where: { company_id: companyId }
    });

    const requests = await prisma.approvalRequest.findMany({
      where: {
        company_id: companyId,
        status: { in: ['pending', 'escalated'] }
      },
      include: {
        chain: true,
        history: {
          orderBy: { created_at: 'desc' }
        }
      }
    });

    // Filter requests in-memory to match active step target role
    return requests.filter(req => {
      const stages = req.chain.stages as any;
      if (!Array.isArray(stages)) return false;
      const currentStage = stages.find((s: any) => s.step === req.current_step);
      return currentStage?.approver_role === userRoleId;
    });
  }
};
