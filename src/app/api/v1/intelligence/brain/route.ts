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

    // 1. Analyze "APPROVAL_DELAY" telemetry over the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const delays = await prisma.operationalTelemetry.findMany({
        where: {
            metric_type: 'APPROVAL_DELAY',
            timestamp: { gte: yesterday }
        }
    });

    // 2. Autonomous Action: If we see many delays, trigger an event to adjust timelines
    if (delays.length > 5) {
        console.log(`[AI Brain] Detected ${delays.length} approval delays. Triggering schedule shift.`);
        
        // Group by company to shift schedules per tenant
        const companyIds = [...new Set(delays.map(d => d.company_id))];
        
        for (const companyId of companyIds) {
            await EventBus.emit('STAGE_TRANSITIONED', {
                action: 'AUTO_SHIFT_SCHEDULE',
                companyId: companyId,
                reason: 'High frequency of approval delays detected.'
            }, 10);
        }
    }

    // You would add more analyzers here (e.g., RENDER_LATENCY, TEAM_EFFICIENCY)

    return NextResponse.json({ success: true, processed_metrics: delays.length });

  } catch (error: any) {
    console.error("AI Brain Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process AI brain" }, { status: 500 });
  }
}
