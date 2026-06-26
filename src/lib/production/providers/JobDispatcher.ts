import prisma from "@/lib/prisma";
import { ProviderManager } from "./ProviderManager";

export class JobDispatcher {
  
  /**
   * Executes a ProductionAIJob end-to-end.
   * Uses the provider manager to find the correct adapter, fetches the credentials,
   * submits the job, and converts the normalized response into a ProductionAsset.
   */
  static async dispatchJob(jobId: string, companyId: string): Promise<void> {
    const job = await prisma.productionAIJob.findUnique({
      where: { id: jobId },
      include: {
        provider: true
      }
    });

    if (!job) throw new Error("Job not found");
    if (job.status !== "Queued") throw new Error(`Job is already ${job.status}`);

    // Mark as running
    await prisma.productionAIJob.update({
      where: { id: jobId },
      data: { status: "Running" }
    });

    try {
      // 1. Get Decrypted Credentials
      const apiKey = await ProviderManager.getDecryptedCredentials(companyId, job.provider_id);

      // 2. Load Adapter
      const adapter = ProviderManager.getAdapter(job.provider.name);

      // 3. Assemble Prompt from associated Prompt Set (Mocked here since job doesn't explicitly store raw prompt text, 
      // but in reality we would fetch the prompt_set_id or pass the prompt directly into the job).
      // For the MVP prototype, we'll fetch the associated prompt set.
      let promptText = "Generate content";
      if (job.prompt_set_id) {
        const pSet = await prisma.productionPromptSet.findUnique({ where: { id: job.prompt_set_id } });
        if (pSet) {
          promptText = pSet.image_prompt || pSet.video_prompt || "Generate content";
        }
      }

      // 4. Submit Job
      const normalizedResponse = await adapter.submitJob(apiKey, job.model_name, promptText);

      // 5. Store as Asset
      // We create a master ProductionAsset and its first Version (V1)
      const asset = await prisma.productionAsset.create({
        data: {
          project_id: job.project_id,
          type: job.asset_type,
          status: "Pending Review",
          scene_id: job.scene_id,
          shot_id: job.shot_id,
        }
      });

      await prisma.productionAssetVersion.create({
        data: {
          asset_id: asset.id,
          job_id: jobId,
          version_number: 1,
          file_url: normalizedResponse.assetUrl || null,
          metadata: normalizedResponse.metadata as any,
          provider_id: job.provider_id,
          model_name: job.model_name,
        }
      });

      // 6. Mark Job Completed
      await prisma.productionAIJob.update({
        where: { id: jobId },
        data: { status: "Completed" }
      });

    } catch (e: any) {
      console.error("Job Dispatch Error:", e);
      // Mark Job Failed
      await prisma.productionAIJob.update({
        where: { id: jobId },
        data: { status: "Failed" } // In a real system, we'd log the error message to the job
      });
      throw e;
    }
  }
}
