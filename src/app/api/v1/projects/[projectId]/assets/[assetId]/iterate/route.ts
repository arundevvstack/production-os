import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { JobDispatcher } from "@/lib/production/providers/JobDispatcher";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; assetId: string }> }
) {
  try {
    const { projectId, assetId } = await params;
    const body = await request.json();
    
    // Validate request
    if (!body.provider_id || !body.model_name || !body.iteration_type) {
      return NextResponse.json({ error: "Missing required iteration fields" }, { status: 400 });
    }

    const asset = await prisma.productionAsset.findUnique({
      where: { id: assetId }
    });

    if (!asset) {
      return NextResponse.json({ error: "Parent asset not found" }, { status: 404 });
    }

    const jobId = crypto.randomUUID();
    
    // Create job with iteration metadata
    const newJob = await prisma.productionAIJob.create({
      data: {
        id: jobId,
        project_id: projectId,
        provider_id: body.provider_id,
        asset_type: asset.type,
        model_name: body.model_name,
        scene_id: asset.scene_id,
        shot_id: asset.shot_id,
        prompt_set_id: asset.prompt_set_id,
        status: "Queued",
        created_by: "system_user",
        metadata: {
          ...body.options,
          iteration_type: body.iteration_type, // "variation", "upscale", "extend", "regenerate"
          parent_asset_id: assetId,
          source_version_id: body.source_version_id
        },
        updated_at: new Date()
      }
    });

    // Fire & Forget job execution
    JobDispatcher.dispatchJob(jobId).catch(err => {
      console.error(`Async Iteration Job ${jobId} Failed:`, err);
    });

    return NextResponse.json(newJob, { status: 201 });
  } catch (error: any) {
    console.error("Asset Iterate POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
