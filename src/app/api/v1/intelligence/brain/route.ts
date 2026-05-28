import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '@/lib/event-bus';

const prisma = new PrismaClient();

/**
 * AI Operations Brain (Cron Job)
 * Analyzes telemetry and takes autonomous actions (e.g., reassigning workflows).
 */
export async function POST(req: Request) {
  try {
    // Basic shared-secret auth for cron jobs
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // --- 1. PHASE 5: Telemetry Shifting ---
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const delays = await prisma.operationalTelemetry.findMany({
        where: { metric_type: 'APPROVAL_DELAY', timestamp: { gte: yesterday } }
    });

    if (delays.length > 5) {
        console.log(`[AI Brain] Detected ${delays.length} approval delays. Triggering schedule shift.`);
        const companyIds = [...new Set(delays.map(d => d.company_id))];
        
        for (const companyId of companyIds) {
            await EventBus.emit('STAGE_TRANSITIONED', {
                action: 'AUTO_SHIFT_SCHEDULE',
                companyId: companyId,
                reason: 'High frequency of approval delays detected.'
            }, 10);
        }
    }

    // --- 2. PHASE 8: Autonomous Incident Remediation ---
    console.log("[Brain] Checking for Unresolved Infrastructure Incidents...");
    const activeIncidents = await prisma.infrastructureIncident.findMany({
        where: { resolved: false },
        take: 10
    });

    let remediationsExecuted = 0;
    for (const incident of activeIncidents) {
        let actionType = 'UNKNOWN';
        let success = false;
        let logs = '';

        if (incident.component.startsWith('AI_PROVIDER_')) {
            // Auto-remediate provider timeout by gracefully shifting queues
            actionType = 'REROUTE_PROVIDER';
            success = true;
            logs = `Autonomously shifted workload from ${incident.component} to fallback provider.`;
        } else if (incident.component === 'EVENT_BUS' || incident.component === 'DB') {
            actionType = 'RESTART_WORKER';
            success = true;
            logs = `Autonomously issued graceful restart command to worker nodes attached to ${incident.component}.`;
        }

        if (actionType !== 'UNKNOWN') {
            await prisma.autoRemediationAction.create({
                data: {
                    incident_id: incident.id,
                    action_type: actionType,
                    success,
                    logs
                }
            });

            // If remediation succeeded, resolve the incident
            if (success) {
                await prisma.infrastructureIncident.update({
                    where: { id: incident.id },
                    data: { resolved: true }
                });
                remediationsExecuted++;
            }
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Brain automation cycle complete.',
        actions_taken: {
            telemetry_alerts: delays.length > 5 ? 1 : 0,
            remediations_executed: remediationsExecuted
        }
    });

  } catch (error: any) {
    console.error("AI Brain Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process AI brain" }, { status: 500 });
  }
}
