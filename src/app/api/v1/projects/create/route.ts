import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PROJECT_TEMPLATES = {
  "AI Production": {
    stages: [
      { name: "Discovery", order: 1 },
      { name: "Concept Development", order: 2 },
      { name: "Script Writing", order: 3 },
      { name: "AI Prompt Creation", order: 4 },
      { name: "Styleframe Approval", order: 5 },
      { name: "AI Asset Generation", order: 6 },
      { name: "AI Video Rendering", order: 7 },
      { name: "Voice Generation", order: 8 },
      { name: "Sound Design", order: 9 },
      { name: "AI Enhancement", order: 10 },
      { name: "Client Review", order: 11 },
      { name: "Final Render", order: 12 },
      { name: "Delivery", order: 13 }
    ],
    objectives: [
      { title: "Concept finalized", estimated_hours: 10, priority: "High" },
      { title: "Script approved", estimated_hours: 5, priority: "High" },
      { title: "Prompt finalized", estimated_hours: 8, priority: "Medium" },
      { title: "AI assets generated", estimated_hours: 40, priority: "High" },
      { title: "Voice approved", estimated_hours: 3, priority: "Medium" },
      { title: "Final render delivered", estimated_hours: 5, priority: "High" }
    ]
  },
  "Hybrid Production": {
    stages: [
      { name: "Discovery", order: 1 },
      { name: "Pre Production", order: 2 },
      { name: "Script", order: 3 },
      { name: "Shot Planning", order: 4 },
      { name: "Production Shoot", order: 5 },
      { name: "Footage Upload", order: 6 },
      { name: "AI Enhancement", order: 7 },
      { name: "VFX", order: 8 },
      { name: "Editing", order: 9 },
      { name: "Color Grading", order: 10 },
      { name: "Sound Design", order: 11 },
      { name: "Client Review", order: 12 },
      { name: "Final Delivery", order: 13 }
    ],
    objectives: [
      { title: "Shoot completed", estimated_hours: 24, priority: "High" },
      { title: "AI enhancement completed", estimated_hours: 16, priority: "High" },
      { title: "VFX approved", estimated_hours: 12, priority: "Medium" },
      { title: "Final export delivered", estimated_hours: 4, priority: "High" }
    ]
  },
  "Normal Production": {
    stages: [
      { name: "Discovery", order: 1 },
      { name: "Pre Production", order: 2 },
      { name: "Storyboarding", order: 3 },
      { name: "Crew Assignment", order: 4 },
      { name: "Equipment Booking", order: 5 },
      { name: "Location Confirmation", order: 6 },
      { name: "Shoot Schedule", order: 7 },
      { name: "Production", order: 8 },
      { name: "Editing", order: 9 },
      { name: "Review", order: 10 },
      { name: "Delivery", order: 11 }
    ],
    objectives: [
      { title: "Crew finalized", estimated_hours: 4, priority: "High" },
      { title: "Equipment booked", estimated_hours: 2, priority: "Medium" },
      { title: "Shoot completed", estimated_hours: 48, priority: "High" },
      { title: "Editing completed", estimated_hours: 30, priority: "High" },
      { title: "Delivery approved", estimated_hours: 2, priority: "High" }
    ]
  }
};

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

    const template = PROJECT_TEMPLATES[project_type as keyof typeof PROJECT_TEMPLATES] || PROJECT_TEMPLATES["Normal Production"];

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

      // 3. Create workflow stages
      for (const stage of template.stages) {
        await tx.projectStage.create({
          data: {
            project_id: newProject.id,
            name: stage.name,
            order: stage.order,
            status: stage.order === 1 ? 'active' : 'pending' // Only first stage active
          }
        });
      }

      // 4. Create default objectives
      for (const obj of template.objectives) {
        await tx.objective.create({
          data: {
            project_id: newProject.id,
            title: obj.title,
            estimated_hours: obj.estimated_hours,
            priority: obj.priority,
            status: "Pending"
          }
        });
      }

      return newProject;
    });

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("Project Creation API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create project" }, { status: 500 });
  }
}
