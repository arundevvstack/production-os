import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { timeEntryId, status, companyId } = body;

    if (!timeEntryId || !status || !companyId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // 1. Verify user is a manager or admin
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }});
    const isAdmin = dbUser?.role_id === 'SUPER_ADMIN' || dbUser?.role_id === 'ADMIN';

    // (If you want true project manager checks, you'd check project_member roles here)
    if (!isAdmin && dbUser?.role_id !== 'PROJECT_MANAGER' && dbUser?.role_id !== 'DEPT_HEAD') {
        return NextResponse.json({ error: 'Forbidden. Only managers can approve time entries.' }, { status: 403 });
    }

    // 2. Perform the update securely using a transaction and auditing
    const updatedEntry = await prisma.$transaction(async (tx) => {
        const entry = await tx.timeEntry.update({
            where: { id: timeEntryId },
            data: {
                approval_status: status,
                approved_by: user.id
            }
        });

        await tx.auditLog.create({
            data: {
                company_id: companyId,
                user_id: user.id,
                entity_type: 'TimeEntry',
                entity_id: timeEntryId,
                action: status.toUpperCase(),
                after_state: { approval_status: status }
            }
        });

        return entry;
    });

    return NextResponse.json({ success: true, data: updatedEntry });

  } catch (error: any) {
    console.error("TimeEntry Approval Error:", error);
    return NextResponse.json({ error: error.message || "Failed to approve time entry" }, { status: 500 });
  }
}
