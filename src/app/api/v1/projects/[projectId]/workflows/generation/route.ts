import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ProviderRegistry } from "@/lib/production/ai/providers/ProviderAdapter";
import { ProviderPayload } from "@/lib/production/ai/GenerationContext";

export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    const { providerName, model, assetType, promptVersionId, specifications } = body;

    if (!promptVersionId || !providerName || !model) {
      return NextResponse.json({ error: "Missing required fields: promptVersionId, providerName, model" }, { status: 400 });
    }

    // Load Approved Prompt Version
    const promptVersion = await prisma.productionPromptVersion.findUnique({
      where: { id: promptVersionId }
    });

    if (!promptVersion) {
      return NextResponse.json({ error: "Prompt version not found" }, { status: 404 });
    }

    // Build ProviderPayload using the database data
    // The provider_parameters usually contain the full generation context from PromptCompiler.
    let providerPayload: ProviderPayload;
    try {
      const parsedParams = promptVersion.provider_parameters as any;
      providerPayload = {
        prompt: promptVersion.image_prompt || "",
        negative_prompt: promptVersion.negative_prompt || "",
        generation_specs: specifications || parsedParams?.generation_specs || {},
        camera_specs: parsedParams?.camera_specs || {},
        generation_context: parsedParams?.generation_context || {},
        references: parsedParams?.references || {}
      };
    } catch (e) {
      providerPayload = {
        prompt: promptVersion.image_prompt || "",
        negative_prompt: promptVersion.negative_prompt || "",
        generation_specs: specifications || {},
        generation_context: {} as any,
        references: {}
      };
    }

    // Find or create a provider record
    let provider = await prisma.productionAIProvider.findFirst({ where: { name: providerName } });
    if (!provider) {
      provider = await prisma.productionAIProvider.create({
        data: {
          id: crypto.randomUUID(),
          name: providerName,
          category: "Image Generation",
          auth_type: "Bearer",
          is_enabled: true,
          updated_at: new Date()
        }
      });
    }

    // Create job record
    const job = await prisma.productionAIJob.create({
      data: {
        id: crypto.randomUUID(),
        project_id: projectId,
        provider_id: provider.id,
        asset_type: assetType || "Image",
        model_name: model,
        status: "Processing",
        started_at: new Date(),
        created_by: "composer",
        request: {
          promptVersionId,
          specifications: specifications || {}
        },
        updated_at: new Date()
      }
    });

    // Dispatch to provider adapter (mock or real) via ProviderRegistry
    const adapter = ProviderRegistry.getAdapter(providerName);
    
    // Validate payload
    if (!adapter.validate(providerPayload)) {
       await prisma.productionAIJob.update({
         where: { id: job.id },
         data: { status: "Failed", completed_at: new Date(), response: { error: "Validation failed for provider" } }
       });
       return NextResponse.json({ error: "Invalid payload for provider" }, { status: 400 });
    }

    let fileUrl: string | null = null;
    try {
      const result = await adapter.generate(providerPayload, job.id, projectId);

      // Poll once for mock providers that resolve immediately
      if (result.status === "Completed" && result.url) {
        fileUrl = result.url;
      } else {
        // Poll for status
        const statusResult = await adapter.getStatus(result.externalJobId);
        if (statusResult.status === "Completed" && statusResult.url) {
          fileUrl = statusResult.url;
        }
      }
    } catch (adapterErr: any) {
      console.warn("[GenerationRoute] Adapter dispatch failed:", adapterErr.message);
    }

    // Create ProductionAsset and Version regardless of gateway status
    const asset = await prisma.productionAsset.create({
      data: {
        id: crypto.randomUUID(),
        project_id: projectId,
        type: assetType || "Image",
        status: fileUrl ? "Completed" : "Processing",
        updated_at: new Date()
      }
    });

    await prisma.productionAssetVersion.create({
      data: {
        id: crypto.randomUUID(),
        asset_id: asset.id,
        job_id: job.id,
        version_number: 1,
        provider_id: provider.id,
        model_name: model,
        prompt_snapshot: { promptVersionId, specifications },
        file_url: fileUrl || "",
        thumbnail_url: fileUrl || "",
        status: fileUrl ? "Ready" : "Processing",
        is_current: true,
        updated_at: new Date()
      }
    });

    // Update job to completed/processing
    await prisma.productionAIJob.update({
      where: { id: job.id },
      data: {
        status: fileUrl ? "Completed" : "Processing",
        completed_at: fileUrl ? new Date() : undefined,
        response: fileUrl ? { url: fileUrl } : undefined
      }
    });

    return NextResponse.json({ success: true, assetId: asset.id, jobId: job.id, fileUrl });
  } catch (error: any) {
    console.error("[GenerationRoute] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch generation job" }, { status: 500 });
  }
}
