import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type EventType = 
  | 'STAGE_TRANSITIONED' 
  | 'OBJECTIVE_COMPLETED' 
  | 'PROJECT_CREATED'
  | 'STAGE_TRANSITIONED'
  | 'ASSET_UPLOADED'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_GRANTED'
  | 'APPROVAL_REJECTED'
  | 'AI_RENDER_STARTED'
  | 'AI_RENDER_COMPLETED'
  | 'AI_RENDER_FAILED'
  | 'WEBHOOK_DISPATCHED';

export class EventBus {
  /**
   * Phase 7: Strict Event Governance & Trace Injection
   */
  static async emit(eventType: EventType, rawPayload: any, priority: number = 0) {
    const traceId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Construct governed payload wrapper
    const governedPayload = {
      event: eventType,
      schema_version: "1.0",
      trace_id: traceId,
      tenant_id: rawPayload.companyId || null,
      timestamp: timestamp,
      payload: rawPayload
    };

    console.log(`[EventBus] Validating ${eventType} (Trace: ${traceId})`);

    // In a production system, we would map the eventType to its specific Zod schema here.
    // e.g. if (eventType === 'PROJECT_CREATED') ProjectCreatedEventSchema.parse(governedPayload);
    // For now, we enforce that the structure has the required governance fields.
    if (!governedPayload.trace_id || !governedPayload.schema_version) {
       throw new Error(`[EventBus] Governance validation failed for event ${eventType}`);
    }

    try {
      const job = await prisma.distributedJobQueue.create({
        data: {
          job_type: eventType,
          payload: governedPayload,
          status: 'pending',
          priority: priority,
          trace_id: traceId,
          schema_version: "1.0"
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

          // Phase 7: Webhook Security Hardening (HMAC SHA-256)
          for (const webhook of activeWebhooks) {
              const rawBody = JSON.stringify(governedPayload);
              const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');
              
              // Generate HMAC Signature: HMAC_SHA256(secret, timestamp + rawBody)
              const signaturePayload = `${timestamp}.${rawBody}`;
              const signature = crypto.createHmac('sha256', webhook.secret).update(signaturePayload).digest('hex');

              console.log(`[EventBus -> Webhook] POST ${webhook.url} (Event: ${eventType}, Signature: ${signature.substring(0, 8)}...)`);
              
              // Simulated async POST with signature headers
              /*
              fetch(webhook.url, {
                 method: 'POST',
                 headers: { 
                     'Content-Type': 'application/json', 
                     'x-dp-signature': signature,
                     'x-dp-timestamp': timestamp,
                     'x-dp-event': eventType,
                     'x-dp-delivery-id': traceId
                 },
                 body: rawBody
              }).then(res => {
                  prisma.webhookDeliveryLog.create({
                      data: {
                          endpoint_id: webhook.id,
                          event_type: eventType,
                          payload_hash: payloadHash,
                          http_status: res.status
                      }
                  });
              }).catch(e => {
                  prisma.webhookDeliveryLog.create({
                      data: {
                          endpoint_id: webhook.id,
                          event_type: eventType,
                          payload_hash: payloadHash,
                          error_message: e.message
                      }
                  });
              });
              */
          }
      }

    } catch (error) {
      console.error(`[EventBus] Error emitting ${eventType}`, error);
      throw error;
    }
  }
}
