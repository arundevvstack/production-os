import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    
    // Find all approved prompts in the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        ProductionStoryboard: { 
          include: { 
            ProductionScene: {
              include: {
                ProductionShot: {
                  include: {
                    ProductionPrompt: { include: { Versions: { where: { status: "Approved" }, orderBy: { version_number: 'desc' }, take: 1 } } }
                  }
                }
              }
            }
          } 
        }
      }
    });

    if (!project) throw new Error("Project not found");

    const allShots = project.ProductionStoryboard?.ProductionScene.flatMap((s: any) => s.ProductionShot) || [];
    const approvedVersions = allShots.flatMap((shot: any) => 
      shot.ProductionPrompt.map((p: any) => p.Versions[0])
    ).filter(Boolean);

    if (approvedVersions.length === 0) {
      return NextResponse.json({ message: "No approved prompts found to batch generate." }, { status: 400 });
    }

    const provider = await prisma.productionAIProvider.findFirst({ where: { name: { contains: "Runway" } } });
    const providerId = provider?.id || "default";

    const createdJobs = [];
    for (const version of approvedVersions) {
      const newJob = await prisma.productionAIJob.create({
        data: {
          id: require('crypto').randomUUID(),
          project_id: projectId,
          provider_id: providerId,
          asset_type: "Video",
          model_name: version.model_rec || "runway-gen3",
          metadata: { prompt: version.video_prompt },
          created_by: "system",
          status: "Queued",
          updated_at: new Date()
        }
      });
      createdJobs.push(newJob);

      // Simulate async processing
      setTimeout(async () => {
        try {
          await prisma.productionAIJob.update({
            where: { id: newJob.id },
            data: { status: "Running", started_at: new Date(), updated_at: new Date() }
          });
          
          await new Promise(r => setTimeout(r, 4000 + Math.random() * 4000));
          
          await prisma.productionAIJob.update({
            where: { id: newJob.id },
            data: { status: "Completed", completed_at: new Date(), updated_at: new Date() }
          });
        } catch (e) {
          console.error("Job processing failed", e);
        }
      }, 1000 + Math.random() * 2000);
    }

    return NextResponse.json({ success: true, count: createdJobs.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
