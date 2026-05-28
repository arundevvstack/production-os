import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

import { TemplateMapper, ObjectiveTemplate } from '@/lib/objective-templates';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      company_id, 
      user_id, // Who is creating the project
      project_name, 
      client_name, 
      client_id,
      budget, 
      deadline, 
      project_type, 
      project_category,
      color 
    } = body;

    if (!company_id || !project_name || !project_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const templateData = TemplateMapper[project_type] || TemplateMapper['Normal Production'];

    // Use Prisma transaction to ensure everything creates successfully
    const project = await prisma.$transaction(async (tx) => {
      // 1. Create the project
      const newProject = await tx.project.create({
        data: {
          company_id,
          client_id,
          project_name,
          project_type,
          project_category,
          budget: budget ? parseFloat(budget) : 0,
          deadline: deadline ? new Date(deadline) : null,
          color,
          status: 'active',
          progress: 0,
        }
      });

      // 2. Assign the creator as Project Manager
      if (user_id) {
        await tx.projectMember.create({
          data: {
            project_id: newProject.id,
            user_id: user_id,
            role: "Project Manager"
          }
        });
      }

      // 3. Create workflow stages and keep their IDs
      const stageIdMap: Record<string, string> = {};
      let order = 1;
      
      for (const stageName of Object.keys(templateData)) {
        const createdStage = await tx.projectStage.create({
          data: {
            project_id: newProject.id,
            name: stageName.replace('_', ' '),
            order: order,
            status: order === 1 ? 'active' : 'pending' // Only first stage active
          }
        });
        stageIdMap[stageName] = createdStage.id;
        order++;

        // 4. Create default objectives for this stage
        const objectives: ObjectiveTemplate[] = templateData[stageName] || [];
        for (const obj of objectives) {
          await tx.objective.create({
            data: {
              project_id: newProject.id,
              stage_id: createdStage.id,
              title: obj.title,
              department: obj.department,
              estimated_hours: obj.estimated_hours,
              priority: obj.priority,
              checklist: obj.checklist,
              status: "Pending"
            }
          });
        }
      }

      return newProject;
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("Project Creation API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create project" }, { status: 500 });
  }
}
