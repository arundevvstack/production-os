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

    try {
      const job = await prisma.distributedJobQueue.create({
        data: {
          job_type: eventType,
          payload: payload,
          status: 'pending',
          priority: priority,
        }
      });
      console.log(`[EventBus] Emitted ${eventType} -> Job ${job.id}`);

      // --- PHASE 6: PUBLIC API WEBHOOKS ---
      // If the payload contains a companyId, fan-out this event to external developers.
      if (payload.companyId) {
          const webhooks = await prisma.webhookEndpoint.findMany({
              where: { company_id: payload.companyId, is_active: true }
          });

          // Filter for webhooks subscribed to this specific event (or listening to all via "*")
          const activeWebhooks = webhooks.filter(w => w.events.includes(eventType) || w.events.includes('*'));

          // In production, this would be pushed to a dedicated 'WebhookRetryQueue'.
          // For now, we simulate the HTTP POST fan-out.
          for (const webhook of activeWebhooks) {
              // Simulated async POST
              console.log(`[EventBus -> Webhook] POST ${webhook.url} (Event: ${eventType})`);
              // fetch(webhook.url, {
              //    method: 'POST',
              //    headers: { 'Content-Type': 'application/json', 'X-DP-Signature': '...' },
              //    body: JSON.stringify({ event: eventType, data: payload, timestamp: new Date() })
              // }).catch(e => console.error(`Webhook Delivery Failed to ${webhook.url}`, e));
          }
      }

    } catch (error) {
      console.error(`[EventBus] Error emitting ${eventType}`, error);
      throw error;
    }
  }
}
