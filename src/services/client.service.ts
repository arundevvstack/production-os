import prisma from '@/lib/prisma';
import { ProjectTemplate } from '@/lib/workflow/template-engine';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

// Initialize Supabase Admin client using service role key
const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const clientService = {
  async create(data: {
    company_id: string;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    industry?: string;
    billing_address?: string;
    gstin?: string;
  }) {
    return prisma.client.create({
      data: {
        company_id: data.company_id,
        name: data.name,
        contact_person: data.contact_person,
        email: data.email,
        phone: data.phone,
        industry: data.industry,
        billing_address: data.billing_address,
        gstin: data.gstin,
      },
    });
  },

  async onboard(data: {
    company_id: string;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    industry?: string;
    billing_address?: string;
    gstin?: string;
    service_vertical?: string;
    sub_vertical?: string;
    template?: ProjectTemplate;
    userId?: string;
    userName?: string;
  }) {
    return prisma.$transaction(async (tx: any) => {
      // 1. Create Client record
      const client = await tx.client.create({
        data: {
          company_id: data.company_id,
          name: data.name,
          contact_person: data.contact_person,
          email: data.email,
          phone: data.phone,
          industry: data.industry,
          billing_address: data.billing_address,
          gstin: data.gstin,
          service_vertical: data.service_vertical || 'General Production',
          sub_vertical: data.sub_vertical || '',
        },
      });

      // 2. Generate Client Portal user in Supabase Auth
      let portalUserId: string | null = null;
      if (data.email) {
        try {
          const tempPassword = `PartnerPass${Math.floor(100000 + Math.random() * 900000)}!`;
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { role: 'CLIENT', full_name: data.contact_person || data.name }
          });

          if (authError) {
            console.error("Supabase Auth admin createUser failed:", authError);
            // Non-blocking in transaction if user already exists
          } else if (authUser?.user) {
            portalUserId = authUser.user.id;
            
            // Register Client Portal User profile in the public.User table
            const clientRole = await tx.role.findFirst({
              where: { name: 'CLIENT' }
            });

            await tx.user.upsert({
              where: { id: portalUserId },
              update: {
                company_id: data.company_id,
                role_id: clientRole?.id || 'CLIENT',
                fullName: data.contact_person || data.name,
                status: 'approved',
                onboarding_status: 'completed',
                department: 'Client'
              },
              create: {
                id: portalUserId,
                email: data.email,
                company_id: data.company_id,
                role_id: clientRole?.id || 'CLIENT',
                fullName: data.contact_person || data.name,
                status: 'approved',
                onboarding_status: 'completed',
                department: 'Client'
              }
            });
          }
        } catch (authErr) {
          console.error("Error creating portal auth user:", authErr);
        }
      }

      // 3. Create Company Workspace (Disabled for the time being)
      // const projectRefCode = `PROJ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      // const project = await tx.project.create({
      //   data: {
      //     company_id: data.company_id,
      //     client_id: client.id,
      //     project_name: `${data.name} Workspace`,
      //     project_ref: projectRefCode,
      //     budget: 0,
      //     status: 'active',
      //     progress: 0,
      //     color: 'card-red',
      //   },
      // });

      // 4. Generate default project template
      // const defaultAIObjectives = [
      //   {
      //     title: `[Onboarding] Kickoff Session & Brand Alignment`,
      //     stage: 'Pre-Production',
      //     status: 'Pending',
      //     priority: 'High',
      //     department: 'Creative',
      //   },
      //   {
      //     title: `[Onboarding] Secure Document Collection & Contract Sign-off`,
      //     stage: 'Pre-Production',
      //     status: 'Pending',
      //     priority: 'High',
      //     department: 'Management',
      //   },
      //   {
      //     title: `[Onboarding] Setup Client Portal Access & Workspace Folders`,
      //     stage: 'Pre-Production',
      //     status: 'Pending',
      //     priority: 'Medium',
      //     department: 'Operations',
      //   },
      //   {
      //     title: `[Onboarding] First Campaign Roadmap & Brief Setup`,
      //     stage: 'Pre-Production',
      //     status: 'Pending',
      //     priority: 'High',
      //     department: 'Marketing',
      //   }
      // ];

      // await tx.objective.createMany({
      //   data: defaultAIObjectives.map(obj => ({
      //     project_id: project.id,
      //     title: obj.title,
      //     status: obj.status,
      //     priority: obj.priority,
      //     department: obj.department,
      //   }))
      // });

      // 5. Create default folders (represented by ActivityLog "Folders Generated")
      // 6. Create finance ledger (represented by default BankAccount and ActivityLog "Ledger Initialized")
      const bankAccountName = `${data.name} Ledger Account`;
      await tx.bankAccount.create({
        data: {
          company_id: data.company_id,
          name: bankAccountName,
          type: 'Bank',
          balance: 0,
        }
      });

      // 7. Log audit activity events
      const logUser = data.userId || 'system';
      const logUserName = data.userName || 'AI Operating Layer';
      
      const logs = [
        { action: 'CLIENT_ONBOARDED', details: `Client "${data.name}" onboarded successfully.` },
        // { action: 'WORKSPACE_GENERATED', details: 'Client Workspace Generated' },
        { action: 'PORTAL_ACCESS_CREATED', details: portalUserId ? 'Portal Access Created' : 'Portal Access Setup Skipped (no email)' },
        { action: 'FINANCE_LEDGER_INITIALIZED', details: 'Finance Ledger Initialized' }
      ];

      // Add parent log "Prospect Converted to Client" if it is done via convert.
      // But for direct client, we log client onboarded.
      await tx.activityLog.createMany({
        data: logs.map(log => ({
          company_id: data.company_id,
          user_id: logUser,
          user_name: logUserName,
          action: log.action,
          details: log.details,
        }))
      });

      // 8. Send onboarding notification
      await tx.notification.create({
        data: {
          company_id: data.company_id,
          user_id: logUser,
          title: 'Client Onboarded',
          message: `Onboarding completed for "${data.name}". Finance ledger initialized.`,
          is_read: false,
        }
      });

      return {
        client,
        // project,
        portalUserId
      };
    }, {
      timeout: 30000
    });
  },

  async getById(id: string) {
    return prisma.client.findUnique({
      where: { id },
      include: {
        projects: true,
        invoices: true,
        prospects: true,
      },
    });
  },

  async getByCompany(company_id: string) {
    return prisma.client.findMany({
      where: { company_id },
      orderBy: { created_at: 'desc' },
    });
  },
};
