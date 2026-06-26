import prisma from '@/lib/prisma';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const conversionService = {
  async convertProspectToClient(prospectId: string, companyId: string, userId: string, userName: string) {
    return prisma.$transaction(async (tx: any) => {
      // 1. Fetch and validate Prospect
      const prospect = await tx.prospect.findUnique({
        where: { id: prospectId }
      });

      if (!prospect) {
        throw new Error('Prospect not found.');
      }

      if (prospect.company_id !== companyId) {
        throw new Error('Unauthorized: Prospect does not belong to your company tenant.');
      }

      if (prospect.is_converted) {
        throw new Error('Prospect has already been converted to a client.');
      }

      // 2. Create Client record copying fields
      const client = await tx.client.create({
        data: {
          company_id: companyId,
          name: prospect.company_name,
          contact_person: prospect.contact_person,
          email: prospect.email,
          phone: prospect.phone || prospect.whatsapp,
          industry: prospect.industry || 'Other',
          billing_address: prospect.billing_address,
          gstin: prospect.gstin,
          service_vertical: prospect.service_vertical,
          sub_vertical: prospect.sub_vertical,
        },
      });

      // 3. Generate Client Portal User
      let portalUserId: string | null = null;
      if (prospect.email) {
        try {
          const tempPassword = `PartnerPass${Math.floor(100000 + Math.random() * 900000)}!`;
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: prospect.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { role: 'CLIENT', full_name: prospect.contact_person || prospect.company_name }
          });

          if (authError) {
            console.error("Supabase Auth admin createUser failed for conversion:", authError);
            // Non-blocking
          } else if (authUser?.user) {
            portalUserId = authUser.user.id;

            // Register Client Portal User profile in public.User table
            const clientRole = await tx.role.findFirst({
              where: { name: 'CLIENT' }
            });

            await tx.user.upsert({
              where: { id: portalUserId },
              update: {
                company_id: companyId,
                role_id: clientRole?.id || 'CLIENT',
                fullName: prospect.contact_person || prospect.company_name,
                status: 'approved',
                onboarding_status: 'completed',
                department: 'Client'
              },
              create: {
                id: portalUserId,
                email: prospect.email,
                company_id: companyId,
                role_id: clientRole?.id || 'CLIENT',
                fullName: prospect.contact_person || prospect.company_name,
                status: 'approved',
                onboarding_status: 'completed',
                department: 'Client'
              }
            });
          }
        } catch (authErr) {
          console.error("Error creating portal auth user during conversion:", authErr);
        }
      }

      // 4. Create Company Workspace (Project record)
      const projectRefCode = `PROJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const project = await tx.project.create({
        data: {
          company_id: companyId,
          client_id: client.id,
          project_name: `${prospect.company_name} Workspace`,
          project_ref: projectRefCode,
          budget: prospect.deal_value || 0,
          status: 'active',
          progress: 0,
          color: 'card-purple',
        },
      });

      // 5. Create onboarding workflow (Objectives)
      const onboardingObjectives = [
        {
          title: `[Onboarding] Kickoff Session & Brand Alignment`,
          stage: 'Pre-Production',
          status: 'Pending',
          priority: 'High',
          department: 'Creative',
        },
        {
          title: `[Onboarding] Secure Document Collection & Contract Sign-off`,
          stage: 'Pre-Production',
          status: 'Pending',
          priority: 'High',
          department: 'Management',
        },
        {
          title: `[Onboarding] Setup Client Portal Access & Workspace Folders`,
          stage: 'Pre-Production',
          status: 'Pending',
          priority: 'Medium',
          department: 'Operations',
        },
        {
          title: `[Onboarding] First Campaign Roadmap & Brief Setup`,
          stage: 'Pre-Production',
          status: 'Pending',
          priority: 'High',
          department: 'Marketing',
        }
      ];

      await tx.objective.createMany({
        data: onboardingObjectives.map(obj => ({
          project_id: project.id,
          title: obj.title,
          status: obj.status,
          priority: obj.priority,
          department: obj.department,
        }))
      });

      // 6. Create finance ledger (default BankAccount and Audit Log)
      const bankAccountName = `${prospect.company_name} Ledger Account`;
      await tx.bankAccount.create({
        data: {
          company_id: companyId,
          name: bankAccountName,
          type: 'Bank',
          balance: 0,
        }
      });

      // 7. Update Prospect: is_converted = true, converted_client_id = client.id, stage = won
      await tx.prospect.update({
        where: { id: prospectId },
        data: {
          is_converted: true,
          converted_client_id: client.id,
          stage: 'won',
        },
      });

      // Link RequirementChart if it exists
      await tx.requirementChart.updateMany({
        where: { prospect_id: prospectId },
        data: {
          project_id: project.id,
          client_id: client.id,
          status: 'approved'
        }
      });

      // 8. Log audit activity logs
      const logs = [
        { action: 'PROSPECT_CONVERTED', details: 'Prospect Converted to Client' },
        { action: 'WORKSPACE_GENERATED', details: 'Client Workspace Generated' },
        { action: 'PORTAL_ACCESS_CREATED', details: portalUserId ? 'Portal Access Created' : 'Portal Access Setup Skipped (no email)' },
        { action: 'FINANCE_LEDGER_INITIALIZED', details: 'Finance Ledger Initialized' }
      ];

      await tx.activityLog.createMany({
        data: logs.map(log => ({
          company_id: companyId,
          user_id: userId,
          user_name: userName,
          action: log.action,
          details: log.details,
        }))
      });

      // 9. Send onboarding notification
      await tx.notification.create({
        data: {
          company_id: companyId,
          user_id: userId,
          title: 'Prospect Converted to Client',
          message: `Onboarding initiated for ${prospect.company_name}. Workspace, portal access, and financial ledgers have been initialized.`,
          is_read: false,
        }
      });

      return {
        client,
        project,
        portalUserId
      };
    }, {
      timeout: 30000
    });
  }
};
