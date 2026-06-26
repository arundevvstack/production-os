import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const body = await req.json();
    const { user_id, review_link, preview_link } = body;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 1. Validate Deliverables (warning check)
    const deliverables = await prisma.deliverable.findMany({
      where: { project_id: projectId }
    });

    const pendingDeliverables = deliverables.filter(d => d.status !== 'completed' && d.status !== 'approved');
    if (pendingDeliverables.length > 0 && body.force !== true) {
      // If we want a strict check, we could block it here.
      // But we will allow a force override or just visual warning on frontend.
    }

    // 2. Lock assets (optional: could update asset status to locked if your schema supports it)
    
    // 3. Update project status to Completed
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'completed' }
    });

    // 4. Update the linked CRM Opportunity
    // We need to find the prospect linked to this project. 
    // We can find it via requirement chart
    const requirement = await prisma.requirementChart.findFirst({
      where: { project_id: projectId }
    });

    if (requirement && requirement.prospect_id) {
      const prospect = await prisma.prospect.findUnique({
        where: { id: requirement.prospect_id }
      });
      
      if (prospect) {
        const pilotDetails = {
          status: 'completed',
          project_id: projectId,
          completed_at: new Date().toISOString(),
          completed_by: user_id,
          review_link: review_link || null,
          preview_link: preview_link || null,
          version: 1
        };

        await prisma.prospect.update({
          where: { id: prospect.id },
          data: {
            pilot_details: pilotDetails
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Pilot production marked as complete" });
  } catch (error: any) {
    console.error("Error completing pilot project:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
