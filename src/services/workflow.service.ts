import prisma from '@/lib/prisma';
import { clientService } from './client.service';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface WorkflowRuleStep {
  name: string;
  action_type: 'CREATE_CLIENT' | 'CREATE_PROJECT' | 'CREATE_OBJECTIVES' | 'CREATE_LEDGER' | 'SEND_NOTIFICATION' | 'PROVISION_PORTAL' | 'CUSTOM_UPDATE';
  params?: any;
}

export const workflowService = {
  /**
   * Triggers a workflow for a specific system event
   */
  async triggerWorkflow(companyId: string, triggerEvent: string, entityId: string, context: Record<string, any>) {
    // 1. Fetch active templates matching the trigger event
    const templates = await prisma.workflowTemplate.findMany({
      where: {
        company_id: companyId,
        trigger: triggerEvent,
        is_active: true
      }
    });

    if (templates.length === 0) {
      console.log(`No active workflow templates found for event: ${triggerEvent}`);
      return [];
    }

    const results = [];

    for (const template of templates) {
      // 2. Parse workflow rules
      const rules = template.rules as any;
      const steps: WorkflowRuleStep[] = Array.isArray(rules?.steps) ? rules.steps : [];

      if (steps.length === 0) {
        console.log(`Workflow template ${template.name} has no steps.`);
        continue;
      }

      // 3. Create WorkflowExecution record
      const execution = await prisma.workflowExecution.create({
        data: {
          template_id: template.id,
          entity_id: entityId,
          status: 'running',
          current_step: 0,
          context: context || {}
        }
      });

      console.log(`Executing Workflow: ${template.name} (Execution ID: ${execution.id})`);
      const executionContext = { ...context, executionId: execution.id };
      const rolledBackIds: { model: string; id: string }[] = [];

      try {
        let stepIdx = 0;
        for (const step of steps) {
          console.log(`Step [${stepIdx + 1}/${steps.length}]: ${step.name}`);

          // Update current step index
          await prisma.workflowExecution.update({
            where: { id: execution.id },
            data: { current_step: stepIdx + 1 }
          });

          // Execute action based on step definition
          const stepResult = await this.executeAction(companyId, step, executionContext, rolledBackIds);

          // Update context with step outputs
          if (stepResult) {
            Object.assign(executionContext, stepResult);
            await prisma.workflowExecution.update({
              where: { id: execution.id },
              data: { context: executionContext }
            });
          }

          // Log execution step success
          await prisma.workflowExecutionLog.create({
            data: {
              execution_id: execution.id,
              step_name: step.name,
              action_type: step.action_type,
              status: 'success'
            }
          });

          stepIdx++;
        }

        // 4. Mark workflow completed
        const finalExecution = await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: { status: 'completed' }
        });

        results.push(finalExecution);

      } catch (err: any) {
        console.error(`Workflow execution failed at step: ${err.message}. Triggering rollback...`);

        // Mark execution status as failed
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: { status: 'failed' }
        });

        // Log step failure
        await prisma.workflowExecutionLog.create({
          data: {
            execution_id: execution.id,
            step_name: `Failed Step`,
            action_type: 'ROLLBACK',
            status: 'failed',
            error: err.message
          }
        });

        // Perform Rollbacks
        await this.rollbackWorkflow(rolledBackIds);

        // Update status to rolled back
        await prisma.workflowExecution.update({
          where: { id: execution.id },
          data: { status: 'rolled_back' }
        });

        throw err;
      }
    }

    return results;
  },

  /**
   * Action Router for running individual workflow actions
   */
  async executeAction(
    companyId: string, 
    step: WorkflowRuleStep, 
    context: Record<string, any>,
    rolledBackIds: { model: string; id: string }[]
  ): Promise<any> {
    switch (step.action_type) {
      case 'CREATE_CLIENT': {
        const client = await prisma.client.create({
          data: {
            company_id: companyId,
            name: context.company_name || `Client ${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            contact_person: context.contact_person,
            email: context.email,
            phone: context.phone || context.whatsapp,
            industry: context.industry || 'Other',
            service_vertical: context.service_vertical,
            sub_vertical: context.sub_vertical,
          }
        });
        rolledBackIds.push({ model: 'Client', id: client.id });
        return { clientId: client.id, client };
      }

      case 'CREATE_PROJECT': {
        if (!context.clientId) {
          throw new Error('Action Error: CREATE_PROJECT requires clientId in context.');
        }
        const projectRefCode = `PROJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const project = await prisma.project.create({
          data: {
            company_id: companyId,
            client_id: context.clientId,
            project_name: context.project_name || `${context.company_name || 'Client'} Workspace`,
            project_ref: projectRefCode,
            budget: parseFloat(context.deal_value) || 0,
            status: 'active',
            progress: 0,
            color: 'card-purple',
          }
        });
        rolledBackIds.push({ model: 'Project', id: project.id });
        return { projectId: project.id, project };
      }

      case 'CREATE_OBJECTIVES': {
        if (!context.projectId) {
          throw new Error('Action Error: CREATE_OBJECTIVES requires projectId in context.');
        }
        const objectivesList = step.params?.objectives || [
          { title: `[Onboarding] Kickoff Session`, priority: 'High', department: 'Creative' },
          { title: `[Onboarding] Setup Client Portal`, priority: 'Medium', department: 'Operations' }
        ];

        const createdObjectives = [];
        for (const obj of objectivesList) {
          const objective = await prisma.objective.create({
            data: {
              project_id: context.projectId,
              title: obj.title,
              status: 'Pending',
              priority: obj.priority || 'Medium',
              department: obj.department || 'Operations'
            }
          });
          rolledBackIds.push({ model: 'Objective', id: objective.id });
          createdObjectives.push(objective);
        }
        return { objectives: createdObjectives };
      }

      case 'CREATE_LEDGER': {
        const bankAccountName = `${context.company_name || 'Client'} Ledger Account`;
        const bankAcc = await prisma.bankAccount.create({
          data: {
            company_id: companyId,
            name: bankAccountName,
            type: 'Bank',
            balance: 0,
          }
        });
        rolledBackIds.push({ model: 'BankAccount', id: bankAcc.id });
        return { ledgerId: bankAcc.id, bankAccount: bankAcc };
      }

      case 'SEND_NOTIFICATION': {
        const targetUserId = context.userId || step.params?.userId;
        if (!targetUserId) {
          console.warn('Notification skipped: No target user ID found.');
          return null;
        }

        const notification = await prisma.notification.create({
          data: {
            company_id: companyId,
            user_id: targetUserId,
            title: step.params?.title || 'Workflow Alert',
            message: step.params?.message || 'A workflow event has triggered.',
            is_read: false,
          }
        });
        rolledBackIds.push({ model: 'Notification', id: notification.id });
        return { notificationId: notification.id };
      }

      case 'PROVISION_PORTAL': {
        if (!context.email) {
          console.log('Portal provisioning skipped: No email in context.');
          return null;
        }
        const tempPassword = `PartnerPass${Math.floor(100000 + Math.random() * 900000)}!`;
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: context.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { role: 'CLIENT', full_name: context.contact_person || context.company_name }
        });

        if (authError) {
          console.error('Portal provisioning failed:', authError);
          // Portal creation fails can be non-blocking, but we can throw to rollback if strict mode is on
          if (step.params?.strict) {
            throw new Error(`Auth Provisioning Error: ${authError.message}`);
          }
          return null;
        }

        if (authUser?.user) {
          const clientRole = await prisma.role.findFirst({
            where: { name: 'CLIENT' }
          });

          const portalUser = await prisma.user.upsert({
            where: { id: authUser.user.id },
            update: {
              company_id: companyId,
              role_id: clientRole?.id || 'CLIENT',
              fullName: context.contact_person || context.company_name,
              status: 'approved',
              onboarding_status: 'completed',
              department: 'Client'
            },
            create: {
              id: authUser.user.id,
              email: context.email,
              company_id: companyId,
              role_id: clientRole?.id || 'CLIENT',
              fullName: context.contact_person || context.company_name,
              status: 'approved',
              onboarding_status: 'completed',
              department: 'Client'
            }
          });

          rolledBackIds.push({ model: 'User', id: authUser.user.id });
          return { portalUserId: authUser.user.id, portalUser };
        }
        return null;
      }

      case 'CUSTOM_UPDATE': {
        const { modelName, idField, data } = step.params || {};
        if (!modelName || !idField || !data) {
          throw new Error('Action Error: CUSTOM_UPDATE requires modelName, idField, and data params.');
        }
        const targetId = context[idField];
        if (!targetId) {
          throw new Error(`Action Error: Target ID "${idField}" not found in context.`);
        }

        // Fetch original record for rollback purposes
        const clientModel: any = (prisma as any)[modelName.toLowerCase()];
        if (!clientModel) {
          throw new Error(`Action Error: Model "${modelName}" not found on prisma.`);
        }

        const originalRecord = await clientModel.findUnique({ where: { id: targetId } });
        const updatedRecord = await clientModel.update({
          where: { id: targetId },
          data
        });

        rolledBackIds.push({ 
          model: `Restore_${modelName}`, 
          id: JSON.stringify({ id: targetId, original: originalRecord }) 
        });

        return { [`updated_${modelName.toLowerCase()}`]: updatedRecord };
      }

      default:
        throw new Error(`Unsupported action type: ${step.action_type}`);
    }
  },

  /**
   * Rolls back all created entities in reverse order of creation
   */
  async rollbackWorkflow(rolledBackIds: { model: string; id: string }[]) {
    console.log('Initiating rollback sequence...');
    // Reverse array to delete last-created first
    const reversed = [...rolledBackIds].reverse();

    for (const item of reversed) {
      try {
        if (item.model.startsWith('Restore_')) {
          const modelName = item.model.split('_')[1];
          const payload = JSON.parse(item.id);
          const clientModel: any = (prisma as any)[modelName.toLowerCase()];
          if (clientModel && payload.original) {
            console.log(`Rolling back updates on ${modelName} ID: ${payload.id}`);
            await clientModel.update({
              where: { id: payload.id },
              data: payload.original
            });
          }
        } else if (item.model === 'User') {
          console.log(`Deleting Auth User profile and credentials ID: ${item.id}`);
          // Remove from public.User
          await prisma.user.delete({ where: { id: item.id } }).catch(() => {});
          // Remove from Supabase Auth
          await supabaseAdmin.auth.admin.deleteUser(item.id).catch(() => {});
        } else {
          const clientModel: any = (prisma as any)[item.model.toLowerCase()];
          if (clientModel) {
            console.log(`Deleting created record on ${item.model} ID: ${item.id}`);
            await clientModel.delete({ where: { id: item.id } });
          }
        }
      } catch (err: any) {
        console.error(`Rollback failed for ${item.model} ID ${item.id}: ${err.message}`);
        // Log error and continue to rollback next items
      }
    }
    console.log('Rollback sequence completed.');
  }
};
