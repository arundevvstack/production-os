import { NextResponse } from 'next/server';
import { WorkflowEngine } from '@/lib/workflow-engine';
import { createClient } from '@/utils/supabase/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const { currentStageId, nextStageId, companyId } = body;

    if (!currentStageId || !nextStageId || !companyId) {
      return NextResponse.json(
        { error: 'Missing currentStageId, nextStageId, or companyId' },
        { status: 400 }
      );
    }

    // Verify user is part of the project or admin
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: user.id
        }
      }
    });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }});

    if (!projectMember && dbUser?.role_id !== 'SUPER_ADMIN' && dbUser?.role_id !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Execute state transition using our transactional engine
    const newState = await WorkflowEngine.transitionStage(
      projectId,
      currentStageId,
      nextStageId,
      user.id,
      companyId
    );

    return NextResponse.json({ success: true, data: newState });

  } catch (error: any) {
    console.error('State Transition Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transition stage' },
      { status: 500 }
    );
  }
}
