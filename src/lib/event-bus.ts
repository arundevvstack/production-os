import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type EventType = 
  | 'STAGE_TRANSITIONED' 
  | 'OBJECTIVE_COMPLETED' 
  | 'ASSET_UPLOADED' 
  | 'BUDGET_EXCEEDED'
  | 'AI_RENDER_FAILED';

export class EventBus {
  /**
   * Emits a system-wide event. Instead of directly executing logic,
   * we queue it into the DistributedJobQueue for async workers to pick up.
   * This decouples the API from slow operations like AI generation, emails, and deep analytics.
   */
  static async emit(eventType: EventType, payload: any, priority: number = 0) {
    console.log(`[EventBus] Emitting ${eventType}`, payload);

    return await prisma.distributedJobQueue.create({
      data: {
        job_type: eventType,
        payload: payload,
        status: 'queued',
        priority: priority
      }
    });
  }
}
