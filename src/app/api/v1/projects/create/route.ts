import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ENTERPRISE_TEMPLATES, DEFAULT_TIMELINE_DAYS, EnterpriseStageTemplate } from '@/lib/enterprise-workflow-templates';

const prisma = new PrismaClient();

/**
 * Distribute stage timelines across the total project duration.
 * Returns { start, end } dates for each stage.
 */
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

  // Ensure the last stage always ends at the exact deadline
  if (result.length > 0) {
    result[result.length - 1].end = new Date(endDate);
  }

  return result;
}

/**
 * Match a department name to the best available team member.
 * Picks the member with the fewest active objectives (workload balancing).
 */
async function findBestAssignee(
  tx: any,
  companyId: string,
  department: string
): Promise<string | null> {
  try {
    // Get users in this company who match the department
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

    // Count active objectives per user to load-balance
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

    // Pick the user with the lowest workload
    loads.sort((a: { userId: string; load: number }, b: { userId: string; load: number }) => a.load - b.load);
    return loads[0]?.userId ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      company_id,
      user_id,
      assignee_id,
      project_name,
      client_name,
      client_id,
      budget,
      deadline,
      project_type,
      project_category,
      color,
    } = body;

    if (!company_id || !project_name || !project_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Resolve template — fall back to Normal Production if unknown type
    const template = ENTERPRISE_TEMPLATES[project_type] ?? ENTERPRISE_TEMPLATES['Normal Production'];

    // Compute project timeline
    const projectStart = new Date();
    const defaultDays = DEFAULT_TIMELINE_DAYS[project_type] ?? 30;
    const projectEnd = deadline
      ? new Date(deadline)
      : new Date(projectStart.getTime() + defaultDays * 24 * 60 * 60 * 1000);

    // Distribute stage timelines based on weights
    const stageTimelines = distributeStageTimelines(projectStart, projectEnd, template.stages);

    // ─── Pre-compute assignees OUTSIDE the transaction ───────────────────────
    // Running async parallel queries inside a Prisma interactive transaction
    // holds the connection open and causes "Transaction not found" errors.
    // We resolve all assignees first, then the transaction only does writes.
    const uniqueDepartments = [...new Set(
      template.stages.flatMap(s => s.objectives.map(o => o.department))
    )];

    const departmentAssigneeMap: Record<string, string | null> = {};
    await Promise.all(
      uniqueDepartments.map(async (dept) => {
        departmentAssigneeMap[dept] = await findBestAssignee(prisma as any, company_id, dept);
      })
    );
    // ─────────────────────────────────────────────────────────────────────────

    // Run all WRITES in a single transaction (no async sub-queries inside)
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Create the project
        const newProject = await tx.project.create({
          data: {
            company_id,
            client_id: client_id ?? null,
            project_name,
            project_type,
            project_category: project_category ?? null,
            budget: budget ? parseFloat(budget) : 0,
            deadline: projectEnd,
            color: color ?? 'bg-indigo-500',
            status: 'active',
            progress: 0,
          },
        });

        // 2. Add creator as Project Manager
        const projectManagerId = assignee_id || user_id;
        if (projectManagerId) {
          await tx.projectMember.create({
            data: {
              project_id: newProject.id,
              user_id: projectManagerId,
              role: 'Project Manager',
            },
          });
        }

        // 3. Create stages + objectives
        const objectiveTitleToId: Record<string, string> = {};
        const pendingDependencies: { childId: string; dependsOnTitles: string[] }[] = [];

        for (let si = 0; si < template.stages.length; si++) {
          const stageDef = template.stages[si];
          const { start: stageStart, end: stageEnd } = stageTimelines[si];

          // Create stage
          const createdStage = await tx.projectStage.create({
            data: {
              project_id: newProject.id,
              name: stageDef.name,
              order: stageDef.order,
              status: si === 0 ? 'active' : 'pending',
              start_date: stageStart,
              end_date: stageEnd,
            },
          });

          const stageMs = stageEnd.getTime() - stageStart.getTime();

          // Create objectives for this stage
          for (const objDef of stageDef.objectives) {
            // Compute due date: stage_start + (offset_ratio × stage_duration)
            const dueDateMs = stageStart.getTime() + Math.round(objDef.offset_ratio * stageMs);
            const clampedDue = new Date(Math.min(dueDateMs, stageEnd.getTime()));

            // Use pre-computed assignee — no query inside tx
            const assigneeId = departmentAssigneeMap[objDef.department] ?? null;

            const createdObj = await tx.objective.create({
              data: {
                project_id: newProject.id,
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

            // Register objective in title map
            objectiveTitleToId[objDef.title] = createdObj.id;

            // Collect pending dependencies
            if (objDef.depends_on && objDef.depends_on.length > 0) {
              pendingDependencies.push({
                childId: createdObj.id,
                dependsOnTitles: objDef.depends_on,
              });
            }
          }
        }

        // 4. Wire dependency chains
        // Use create + ignore-duplicate instead of upsert to avoid stalling the tx
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
                // Ignore duplicate dependency error
              }
            }
          }
        }

        // 5. Create audit log
        if (user_id) {
          await tx.auditLog.create({
            data: {
              company_id,
              user_id,
              action: 'PROJECT_CREATED',
              entity_type: 'Project',
              entity_id: newProject.id,
              after_state: {
                project_type,
                stages_count: template.stages.length,
                objectives_count: Object.keys(objectiveTitleToId).length,
                dependencies_count: pendingDependencies.reduce((acc, d) => acc + d.dependsOnTitles.length, 0),
                timeline_start: projectStart.toISOString(),
                timeline_end: projectEnd.toISOString(),
              },
            },
          });
        }

        return {
          project: newProject,
          workspace_summary: {
            stages: template.stages.length,
            objectives: Object.keys(objectiveTitleToId).length,
            dependencies: pendingDependencies.reduce((acc, d) => acc + d.dependsOnTitles.length, 0),
            timeline_days: Math.round((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)),
          },
        };
      },
      {
        timeout: 60000, // 60s — write-only tx is fast, but generous for slow DBs
      }
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Project Creation API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
