import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();

    const {
      sceneId, shotId, promptSetId, providerId, modelName, assetType, prompt,
      // alternate snake_case field names from CreateJobDialog
      prompt_set_id, provider_id, model_name, asset_type, scene_id, shot_id,
    } = body;

    // Normalize field names (handle both camelCase and snake_case)
    const resolvedShotId = shotId || shot_id || null;
    const resolvedSceneId = sceneId || scene_id || null;
    const resolvedPromptSetId = promptSetId || prompt_set_id || null;
    const resolvedModelName = modelName || model_name || "openai/gpt-4o";
    const resolvedAssetType = assetType || asset_type || "Image";

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    // provider_id is required — look up first available provider if not provided
    let resolvedProviderId = providerId || provider_id;
    if (!resolvedProviderId) {
      const defaultProvider = await prisma.productionAIProvider.findFirst({
        where: { is_enabled: true }
      });
      if (!defaultProvider) {
        return NextResponse.json({ error: "No active AI provider configured. Please add one in Settings." }, { status: 400 });
      }
      resolvedProviderId = defaultProvider.id;
    }

    // created_by — look up from project or use placeholder
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const job = await prisma.productionAIJob.create({
      data: {
        id: crypto.randomUUID(),
        project_id: projectId,
        shot_id: resolvedShotId,
        scene_id: resolvedSceneId,
        prompt_set_id: resolvedPromptSetId,
        provider_id: resolvedProviderId,
        model_name: resolvedModelName,
        asset_type: resolvedAssetType,
        status: "Queued",
        created_by: "system",
        updated_at: new Date(),
      }
    });

    return NextResponse.json({ success: true, jobId: job.id, status: job.status });
  } catch (error: any) {
    console.error("Job Run Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
