import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ENTERPRISE_TEMPLATES, DEFAULT_TIMELINE_DAYS, EnterpriseStageTemplate } from '@/lib/enterprise-workflow-templates';

const prisma = new PrismaClient();

function distributeStageTimelines(
  startDate: Date,
  endDate: Date,
  stages: EnterpriseStageTemplate[]
): { start: Date; end: Date }[] {
  const totalMs = endDate.getTime() - startDate.getTime();
  const result: { start: Date; end: Date }[] = [];
  let cursor = startDate.getTime();

  for (const stage of stages) {
    const stageDuration = Math.round(totalMs * stage.weight);
    const stageStart = new Date(cursor);
    const stageEnd = new Date(cursor + stageDuration);
    result.push({ start: stageStart, end: stageEnd });
    cursor += stageDuration;
  }

  if (result.length > 0) {
    result[result.length - 1].end = new Date(endDate);
  }

  return result;
}

async function findBestAssignee(
  tx: any,
  companyId: string,
  department: string
): Promise<string | null> {
  try {
    const users = await tx.user.findMany({
      where: {
        company_id: companyId,
        department: {
          contains: department,
          mode: 'insensitive',
        },
        status: { not: 'inactive' },
      },
      select: { id: true, department: true },
    });

    if (!users || users.length === 0) return null;

    const loads = await Promise.all(
      users.map(async (u: { id: string; department: string }) => {
        const count = await tx.objective.count({
          where: {
            assignee_id: u.id,
            status: { in: ['Pending', 'In Progress'] },
          },
        });
        return { userId: u.id, load: count };
      })
    );

    loads.sort((a: { userId: string; load: number }, b: { userId: string; load: number }) => a.load - b.load);
    return loads[0]?.userId ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const { newType, user_id } = body;

    if (!projectId || !newType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const template = ENTERPRISE_TEMPLATES[newType];
    if (!template) {
      return NextResponse.json({ error: 'Invalid pipeline type' }, { status: 400 });
    }

    // Fetch existing project to get company_id and deadline
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectStart = new Date();
    const defaultDays = DEFAULT_TIMELINE_DAYS[newType] ?? 30;
    const projectEnd = project.deadline ? new Date(project.deadline) : new Date(projectStart.getTime() + defaultDays * 24 * 60 * 60 * 1000);

    const stageTimelines = distributeStageTimelines(projectStart, projectEnd, template.stages);

    const uniqueDepartments = [...new Set(
      template.stages.flatMap(s => s.objectives.map(o => o.department))
    )];

    const departmentAssigneeMap: Record<string, string | null> = {};
    await Promise.all(
      uniqueDepartments.map(async (dept) => {
        departmentAssigneeMap[dept] = await findBestAssignee(prisma as any, project.company_id, dept);
      })
    );

    const result = await prisma.$transaction(
      async (tx) => {
        // Delete all existing objectives and stages
        // (Assuming Cascade delete handles objective dependencies, time entries, etc. 
        // If not, we explicitly delete objectives first)
        await tx.objective.deleteMany({
          where: { project_id: projectId }
        });
        await tx.projectStage.deleteMany({
          where: { project_id: projectId }
        });

        // Update project type
        const updatedProject = await tx.project.update({
          where: { id: projectId },
          data: { project_type: newType, progress: 0, status: 'active' }
        });

        const objectiveTitleToId: Record<string, string> = {};
        const pendingDependencies: { childId: string; dependsOnTitles: string[] }[] = [];

        for (let si = 0; si < template.stages.length; si++) {
          const stageDef = template.stages[si];
          const { start: stageStart, end: stageEnd } = stageTimelines[si];

          const createdStage = await tx.projectStage.create({
            data: {
              project_id: projectId,
              name: stageDef.name,
              order: stageDef.order,
              status: si === 0 ? 'active' : 'pending',
              start_date: stageStart,
              end_date: stageEnd,
            },
          });

          const stageMs = stageEnd.getTime() - stageStart.getTime();

          for (const objDef of stageDef.objectives) {
            const dueDateMs = stageStart.getTime() + Math.round(objDef.offset_ratio * stageMs);
            const clampedDue = new Date(Math.min(dueDateMs, stageEnd.getTime()));

            const assigneeId = departmentAssigneeMap[objDef.department] ?? null;

            const createdObj = await tx.objective.create({
              data: {
                project_id: projectId,
                stage_id: createdStage.id,
                title: objDef.title,
                description: objDef.description,
                department: objDef.department,
                priority: objDef.priority,
                estimated_hours: objDef.estimated_hours,
                checklist: objDef.checklist,
                status: 'Pending',
                due_date: clampedDue,
                assignee_id: assigneeId,
              },
            });

            objectiveTitleToId[objDef.title] = createdObj.id;

            if (objDef.depends_on && objDef.depends_on.length > 0) {
              pendingDependencies.push({
                childId: createdObj.id,
                dependsOnTitles: objDef.depends_on,
              });
            }
          }
        }

        for (const dep of pendingDependencies) {
          for (const parentTitle of dep.dependsOnTitles) {
            const parentId = objectiveTitleToId[parentTitle];
            if (parentId && parentId !== dep.childId) {
              try {
                await tx.objectiveDependency.create({
                  data: {
                    parent_id: parentId,
                    child_id: dep.childId,
                    type: 'blocking',
                  },
                });
              } catch {
                // Ignore duplicates
              }
            }
          }
        }

        if (user_id) {
          await tx.auditLog.create({
            data: {
              company_id: project.company_id,
              user_id,
              action: 'PIPELINE_CHANGED',
              entity_type: 'Project',
              entity_id: projectId,
              after_state: {
                project_type: newType,
                stages_count: template.stages.length,
                objectives_count: Object.keys(objectiveTitleToId).length,
              },
            },
          });
        }

        return updatedProject;
      },
      {
        timeout: 60000,
      }
    );

    return NextResponse.json({ success: true, project: result });
  } catch (error: any) {
    console.error('Change Pipeline API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to change pipeline' },
      { status: 500 }
    );
  }
}
