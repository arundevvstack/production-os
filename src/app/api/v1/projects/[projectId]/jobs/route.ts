import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { JobDispatcher } from "@/lib/production/providers/JobDispatcher";

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    
    // Lazy poll for Running jobs
    const runningJobs = await prisma.productionAIJob.findMany({
      where: { project_id: projectId, status: "Running", external_job_id: { not: null } },
      include: { ProductionAIProvider: true }
    });

    for (const job of runningJobs) {
      if (!job.external_job_id || !job.ProductionAIProvider) continue;
      try {
        const { ProviderManager } = await import("@/lib/production/providers/ProviderManager");
        const adapter = ProviderManager.getAdapter(job.ProductionAIProvider.name);
        
        // Use a dummy api key for checking status locally if we don't have one
        const apiKey = "local"; 
        const statusCheck = await adapter.checkStatus(apiKey, job.external_job_id);
        
        if (statusCheck.status === "completed" && statusCheck.result) {
          const { ReviewEngine } = await import("@/lib/production/engines/ReviewEngine");
          
          // First, find the asset version created during dispatch
          const assetVersion = await prisma.productionAssetVersion.findFirst({
            where: { job_id: job.id },
            orderBy: { created_at: 'desc' }
          });
          
          if (assetVersion) {
            await prisma.productionAssetVersion.update({
              where: { id: assetVersion.id },
              data: {
                file_url: statusCheck.result.assetUrl,
                metadata: statusCheck.result.metadata as any,
                updated_at: new Date()
              }
            });
            await ReviewEngine.evaluateAssetVersion(assetVersion.id);
          }
          
          const existingJobMetadata = job.metadata ? (job.metadata as any) : {};
          
          await prisma.productionAIJob.update({
            where: { id: job.id },
            data: { 
              status: "Completed", 
              completed_at: new Date(), 
              updated_at: new Date(),
              metadata: {
                ...existingJobMetadata,
                ...statusCheck.result.metadata,
                result_url: statusCheck.result.assetUrl
              }
            }
          });

          // Update character if applicable
          if (job.character_id && statusCheck.result.assetUrl) {
             await prisma.productionCharacter.update({
               where: { id: job.character_id },
               data: { reference_image_url: statusCheck.result.assetUrl }
             });
          }
        } else if (statusCheck.status === "failed") {
          await prisma.productionAIJob.update({
            where: { id: job.id },
            data: { status: "Failed", error_message: statusCheck.error || "Unknown Error", completed_at: new Date(), updated_at: new Date() }
          });
        }
      } catch (e) {
        console.error(`Failed to poll status for job ${job.id}:`, e);
      }
    }

    const jobs = await prisma.productionAIJob.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' }
    });
    return NextResponse.json(jobs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { provider_id, asset_type, model_name, options, character_id } = body;

    // Resolve logical "local_gateway" name to the actual DB provider UUID
    let resolvedProviderId = provider_id;
    if (provider_id === "local_gateway" || provider_id === "local") {
      const localProvider = await prisma.productionAIProvider.findFirst({
        where: { name: { contains: "Local" } }
      });
      if (!localProvider) {
        return NextResponse.json({ error: "Local AI provider not found in database. Ensure the DB is seeded." }, { status: 400 });
      }
      resolvedProviderId = localProvider.id;
    }

    const newJob = await prisma.productionAIJob.create({
      data: {
        id: require('crypto').randomUUID(),
        project_id: projectId,
        provider_id: resolvedProviderId,
        asset_type,
        model_name,
        metadata: options,
        character_id: character_id || null,
        created_by: "system",
        status: "Queued",
        updated_at: new Date()
      }
    });

    // Fire and forget JobDispatcher to run async. It will update the database based on the Provider adapter response.
    JobDispatcher.dispatchJob(newJob.id).catch(e => {
      console.error(`Failed to dispatch job ${newJob.id}:`, e);
    });

    return NextResponse.json(newJob);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
