import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { JobDispatcher } from "@/lib/production/providers/JobDispatcher";

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const body = await req.json();
    const { prompt_set_id, provider_id, model_name, asset_type, scene_id, shot_id } = body;
    const companyId = "c-1"; // Hardcoded for this prototype

    if (!prompt_set_id || !provider_id || !model_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create the queued job
    const job = await prisma.productionAIJob.create({
      data: {
        project_id: params.projectId,
        scene_id: scene_id || null,
        shot_id: shot_id || null,
        prompt_set_id,
        provider_id,
        model_name,
        asset_type: asset_type || "Text",
        status: "Queued",
      }
    });

    // 2. Dispatch Job Synchronously (For Prototype)
    // In production, we would drop this to a BullMQ queue and return { jobId } instantly.
    await JobDispatcher.dispatchJob(job.id, companyId);

    // 3. Find the newly created asset version to return the assetId
    const finalAssetVersion = await prisma.productionAssetVersion.findFirst({
      where: { job_id: job.id },
      orderBy: { created_at: 'desc' }
    });
    
    // Actually wait, JobDispatcher.ts doesn't explicitly save `job_id` on the `ProductionAssetVersion`.
    // Let me check JobDispatcher.ts to see if it sets `job_id`.
    // If not, we might need to find by `project_id` and `provider_id` sorted by date, or we can just fetch the latest asset.
    // Let's modify JobDispatcher to pass the job_id. We'll find by `asset_id` where `shot_id` and `scene_id` match.
    // Wait, let me just find the latest asset for this project.
    const latestAsset = await prisma.productionAsset.findFirst({
      where: { project_id: params.projectId },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ 
      success: true, 
      jobId: job.id, 
      assetId: latestAsset?.id 
    });

  } catch (error: any) {
    console.error("Run Job Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
