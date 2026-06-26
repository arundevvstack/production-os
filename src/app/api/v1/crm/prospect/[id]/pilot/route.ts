import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: prospectId } = await context.params;
    const body = await req.json();
    const { company_id, created_by } = body;

    if (!prospectId || !company_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the prospect
    const prospect = await prisma.prospect.findUnique({
      where: { id: prospectId }
    });

    if (!prospect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    // Get the latest requirement chart
    let requirement = await prisma.requirementChart.findFirst({
      where: { prospect_id: prospectId },
      orderBy: { created_at: 'desc' }
    });

    // Create the Project
    const projectName = `${prospect.company_name} - Pilot Video`;
    
    const project = await prisma.project.create({
      data: {
        company_id,
        project_name: projectName,
        client_name: prospect.company_name,
        project_type: 'Pilot Production',
        project_category: 'Pilot Video',
        status: 'In Production',
        // Optional logic to assign project manager or created_by could be linked via Members
      }
    });

    // Link the requirement chart to the project if it exists, or create a copy
    if (requirement) {
      await prisma.requirementChart.update({
        where: { id: requirement.id },
        data: { project_id: project.id }
      });
    }

    // Update the prospect stage to pilot_video and clear any completed pilot details
    await prisma.prospect.update({
      where: { id: prospectId },
      data: { 
        stage: 'pilot_video',
        pilot_details: { status: 'in_production', project_id: project.id }
      }
    });

    // Notifications can be triggered here if there's a notification queue/webhook
    // Example: send to in-app notifications
    if (created_by) {
        await prisma.notification.create({
            data: {
                company_id,
                user_id: created_by, // Send to the person who triggered it or a manager
                title: 'Pilot Project Created',
                message: `Pilot project ${projectName} has been created and is in production.`,
                type: 'info'
            }
        });
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("Error creating pilot project:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
