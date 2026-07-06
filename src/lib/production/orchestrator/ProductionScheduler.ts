import prisma from "@/lib/prisma";
import { ProductionEventBus } from "./ProductionEventBus";

export class ProductionScheduler {
  /**
   * Scans queued jobs and determines if they should be dispatched based on priority and limits.
   * For the prototype, we simulate a sweep.
   */
  static async processQueue() {
    const queuedJobs = await prisma.productionAIJob.findMany({
      where: { status: 'Queued' },
      orderBy: { created_at: 'asc' },
      take: 10
    });

    for (const job of queuedJobs) {
      // Simulate balancing or limits: e.g. delay if too many running
      const runningCount = await prisma.productionAIJob.count({
         where: { status: 'Running', provider_id: job.provider_id }
      });

      if (runningCount < 5) { // Arbitrary concurrency limit
         await prisma.productionAIJob.update({
           where: { id: job.id },
           data: { status: 'Running' }
         });
         ProductionEventBus.publish("GenerationStarted", job.project_id, { jobId: job.id });
      }
    }
  }

  /**
   * Sweeps for jobs stuck in 'Running' for too long or explicitly Failed, and re-queues them.
   */
  static async retryFailedJobs() {
    const failedJobs = await prisma.productionAIJob.findMany({
      where: { status: 'Failed' }
    });

    for (const job of failedJobs) {
      await prisma.productionAIJob.update({
        where: { id: job.id },
        data: { status: 'Queued', error_message: null }
      });
      ProductionEventBus.publish("StageStarted", job.project_id, { message: `Retrying Job ${job.id}` });
    }
  }
}
