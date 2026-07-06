import prisma from "@/lib/prisma";
import { ProductionEventBus } from "../orchestrator/ProductionEventBus";

export class RecoveryEngine {
  /**
   * Identifies orphaned jobs (e.g. running for > 24 hours) or hard-failed provider limits
   * and builds a recovery plan.
   */
  static async executeRecovery(projectId: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Find stuck jobs
    const stuckJobs = await prisma.productionAIJob.findMany({
      where: { project_id: projectId, status: 'Running', created_at: { lt: yesterday } }
    });

    for (const job of stuckJobs) {
      await prisma.productionAIJob.update({
        where: { id: job.id },
        data: { status: 'Failed', error_message: 'Auto-Failed by RecoveryEngine: Timeout' }
      });
      ProductionEventBus.publish("GenerationFailed", projectId, { jobId: job.id, reason: "Timeout" });
    }

    return {
      recovered_jobs: stuckJobs.length,
      action: stuckJobs.length > 0 ? "Forced failure for stuck jobs to allow Scheduler retry." : "No recovery needed."
    };
  }
}
