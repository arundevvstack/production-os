import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/v1/projects/[projectId]/objectives
 * Returns all objectives for a project grouped by stage, with dependency info.
 */
export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Fetch all stages for this project
    const stages = await prisma.projectStage.findMany({
      where: { project_id: projectId },
      orderBy: { order: 'asc' },
    });

    // Fetch all objectives with their dependency chains
    const objectives = await prisma.objective.findMany({
      where: { project_id: projectId },
      include: {
        depends_on: {
          include: {
            parent: {
              select: { id: true, title: true, status: true },
            },
          },
        },
        blocking: {
          include: {
            child: {
              select: { id: true, title: true, status: true },
            },
          },
        },
        assignee: {
          select: { id: true, fullName: true, email: true, department: true },
        },
        time_entries: {
          select: { duration_sec: true, is_billable: true },
        },
      },
      orderBy: { due_date: 'asc' },
    });

    // Group objectives by stage
    const stagesWithObjectives = stages.map((stage) => {
      const stageObjectives = objectives.filter((o) => o.stage_id === stage.id);
      const totalHours = stageObjectives.reduce((sum, o) => sum + (o.estimated_hours ?? 0), 0);
      const completedCount = stageObjectives.filter((o) =>
        ['Completed', 'Approved'].includes(o.status)
      ).length;
      const blockedCount = stageObjectives.filter((o) => o.is_blocked).length;
      const overdueCount = stageObjectives.filter(
        (o) => o.due_date && new Date(o.due_date) < new Date() && !['Completed', 'Approved'].includes(o.status)
      ).length;

      return {
        ...stage,
        objectives: stageObjectives.map((obj) => ({
          ...obj,
          total_tracked_hours: obj.time_entries.reduce(
            (sum: number, t: { duration_sec: number }) => sum + t.duration_sec / 3600,
            0
          ),
          is_overdue:
            obj.due_date != null &&
            new Date(obj.due_date) < new Date() &&
            !['Completed', 'Approved'].includes(obj.status),
          blocking_titles: obj.blocking.map((b: { child: { title: string } }) => b.child.title),
          blocked_by_titles: obj.depends_on
            .filter((d: { parent: { status: string } }) => !['Completed', 'Approved'].includes(d.parent.status))
            .map((d: { parent: { title: string } }) => d.parent.title),
        })),
        summary: {
          total: stageObjectives.length,
          completed: completedCount,
          blocked: blockedCount,
          overdue: overdueCount,
          estimated_hours: totalHours,
          completion_pct:
            stageObjectives.length > 0
              ? Math.round((completedCount / stageObjectives.length) * 100)
              : 0,
        },
      };
    });

    // Project-level summary
    const totalObjectives = objectives.length;
    const completedObjectives = objectives.filter((o) =>
      ['Completed', 'Approved'].includes(o.status)
    ).length;

    return NextResponse.json({
      stages: stagesWithObjectives,
      summary: {
        total_objectives: totalObjectives,
        completed_objectives: completedObjectives,
        overall_completion_pct:
          totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0,
        blocked_objectives: objectives.filter((o) => o.is_blocked).length,
        overdue_objectives: objectives.filter(
          (o) => o.due_date && new Date(o.due_date) < new Date() && !['Completed', 'Approved'].includes(o.status)
        ).length,
        total_estimated_hours: objectives.reduce((sum, o) => sum + (o.estimated_hours ?? 0), 0),
      },
    });
  } catch (error: any) {
    console.error('Objectives fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/v1/projects/[projectId]/objectives
 * Create a new objective, respecting dependency rules.
 */
export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;
    const body = await req.json();
    const {
      title,
      description,
      department,
      priority,
      estimated_hours,
      due_date,
      stage_id,
      assignee_id,
      checklist,
      depends_on_ids,
    } = body;

    if (!projectId || !title || !stage_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const objective = await prisma.$transaction(async (tx) => {
      const newObj = await tx.objective.create({
        data: {
          project_id: projectId,
          stage_id,
          title,
          description: description ?? null,
          department: department ?? 'Production',
          priority: priority ?? 'Medium',
          estimated_hours: estimated_hours ? parseFloat(estimated_hours) : null,
          due_date: due_date ? new Date(due_date) : null,
          assignee_id: assignee_id ?? null,
          checklist: checklist ?? [],
          status: 'Pending',
        },
      });

      // Wire dependencies if provided
      if (depends_on_ids && depends_on_ids.length > 0) {
        for (const parentId of depends_on_ids) {
          await tx.objectiveDependency.create({
            data: {
              parent_id: parentId,
              child_id: newObj.id,
              type: 'blocking',
            },
          });
        }
      }

      return newObj;
    });

    return NextResponse.json({ success: true, objective });
  } catch (error: any) {
    console.error('Objective creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
