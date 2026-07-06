import prisma from "@/lib/prisma";
import { ProviderManager } from "./ProviderManager";
import { NormalizedProviderResponse, GenerationOptions } from "./ProviderAdapterInterface";
import { ReviewEngine } from "../engines/ReviewEngine";

export class JobDispatcher {
  
  static async dispatchJob(jobId: string): Promise<void> {
    const job = await prisma.productionAIJob.findUnique({
      where: { id: jobId },
      include: { ProductionAIProvider: true }
    });

    if (!job) throw new Error("Job not found");
    if (job.status !== "Queued") throw new Error(`Job is already ${job.status}`);

    await prisma.productionAIJob.update({
      where: { id: jobId },
      data: { status: "Running", started_at: new Date(), updated_at: new Date() }
    });

    try {
      const apiKey = await ProviderManager.getDecryptedCredentials(job.provider_id);
      const adapter = ProviderManager.getAdapter(job.ProductionAIProvider.name);

      let promptText = "Generate content";
      if (job.prompt_set_id) {
        const pSet = await prisma.productionPrompt.findUnique({ 
          where: { id: job.prompt_set_id },
          include: { Versions: { orderBy: { version_number: 'desc' }, take: 1 } }
        });
        if (pSet && pSet.Versions.length > 0) {
          const v = pSet.Versions[0];
          promptText = v.image_prompt || v.video_prompt || v.animation_prompt || promptText;
        }
      }

      // Merge prompt with any explicit options from job metadata
      const jobOptions = (job.metadata as GenerationOptions) || {};
      
      let normalizedResponse: NormalizedProviderResponse;

      // Switch generation based on Asset Type
      const aType = job.asset_type.toLowerCase();
      if (aType.includes("image")) {
        normalizedResponse = await adapter.generateImage(apiKey, job.model_name, promptText, jobOptions);
      } else if (aType.includes("video")) {
        normalizedResponse = await adapter.generateVideo(apiKey, job.model_name, promptText, jobOptions);
      } else if (aType.includes("audio") || aType.includes("music") || aType.includes("sfx")) {
        normalizedResponse = await adapter.generateAudio(apiKey, job.model_name, promptText, jobOptions);
      } else if (aType.includes("voice") || aType.includes("tts")) {
        normalizedResponse = await adapter.generateVoice(apiKey, job.model_name, promptText, promptText, jobOptions);
      } else if (aType.includes("storyboard")) {
        normalizedResponse = await adapter.generateStoryboard(apiKey, job.model_name, promptText, jobOptions);
      } else {
        // Fallback to chat/text completion
        if (adapter.submitJob) {
          normalizedResponse = await adapter.submitJob(apiKey, job.model_name, promptText, jobOptions);
        } else {
          throw new Error(`Asset type ${job.asset_type} is not explicitly supported by this adapter routing, and no fallback text submitJob exists.`);
        }
      }

      // If the response is asynchronous (e.g. Runway returns metadata but no assetUrl immediately),
      // we might mark the job as "Running" instead of Completed, but for the MVP, we assume completed
      // if checkStatus isn't explicitly hooked up in a cron.
      const isAsync = !normalizedResponse.assetUrl && !normalizedResponse.textContent && normalizedResponse.metadata;
      
      const parentAssetId = job.metadata ? (job.metadata as any).parent_asset_id : null;
      let assetId = parentAssetId;

      if (!assetId) {
        const asset = await prisma.productionAsset.create({
          data: {
            id: require('crypto').randomUUID(),
            project_id: job.project_id,
            type: job.asset_type,
            status: "Pending Review",
            scene_id: job.scene_id,
            shot_id: job.shot_id,
            updated_at: new Date()
          }
        });
        assetId = asset.id;
      } else {
        // Find existing asset to get next version number
        await prisma.productionAsset.update({
          where: { id: assetId },
          data: { status: "Pending Review", updated_at: new Date() }
        });
      }

      // Calculate next version number
      const existingVersions = await prisma.productionAssetVersion.count({
        where: { asset_id: assetId }
      });
      const nextVersionNumber = existingVersions + 1;

      const assetVersion = await prisma.productionAssetVersion.create({
        data: {
          id: require('crypto').randomUUID(),
          asset_id: assetId,
          job_id: jobId,
          version_number: nextVersionNumber,
          file_url: normalizedResponse.assetUrl || null,
          metadata: {
            ...normalizedResponse.metadata,
            textContent: normalizedResponse.textContent
          },
          provider_id: job.provider_id,
          model_name: job.model_name,
          updated_at: new Date()
        }
      });

      await prisma.productionAIJob.update({
        where: { id: jobId },
        data: { 
          status: isAsync ? "Running" : "Completed", 
          completed_at: isAsync ? null : new Date(),
          external_job_id: normalizedResponse.metadata?.raw_response?.id || null, // e.g. task id
          metadata: normalizedResponse.metadata as any
        }
      });

      // Run AI Review if the generation was synchronous
      if (!isAsync) {
        await ReviewEngine.evaluateAssetVersion(assetVersion.id);
      }

    } catch (e: any) {
      console.error("Job Dispatch Error:", e);
      await prisma.productionAIJob.update({
        where: { id: jobId },
        data: { status: "Failed", error_message: e.message || "Unknown error", completed_at: new Date() }
      });
      throw e;
    }
  }
}
