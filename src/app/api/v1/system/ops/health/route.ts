import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@/utils/supabase/server';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id }});

    if (dbUser?.role_id !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden. Ops Console requires SUPER_ADMIN access.' }, { status: 403 });
    }

    // 1. Queue Health (Phase 7)
    const pendingJobs = await prisma.distributedJobQueue.count({ where: { status: 'pending' } });
    const failedJobs = await prisma.distributedJobQueue.count({ where: { status: 'failed' } });
    
    // 2. Webhook Failures
    const recentWebhookFailures = await prisma.webhookDeliveryLog.findMany({
        where: { 
            http_status: { not: 200 },
            timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: { endpoint: true }
    });

    // 3. Infrastructure Incidents
    const activeIncidents = await prisma.infrastructureIncident.findMany({
        where: { resolved: false },
        orderBy: { timestamp: 'desc' }
    });

    // 4. AI Provider Health (Simulated averages based on recent jobs)
    const providerHealth = {
        OpenAI: { status: activeIncidents.some(i => i.component === 'AI_PROVIDER_OPENAI') ? 'DEGRADED' : 'OPERATIONAL' },
        Anthropic: { status: activeIncidents.some(i => i.component === 'AI_PROVIDER_ANTHROPIC') ? 'DEGRADED' : 'OPERATIONAL' },
        Runway: { status: activeIncidents.some(i => i.component === 'AI_PROVIDER_RUNWAY') ? 'DEGRADED' : 'OPERATIONAL' },
    };

    return NextResponse.json({ 
        success: true, 
        data: {
            queue_health: {
                pending: pendingJobs,
                dead_letter: failedJobs
            },
            webhook_health: {
                recent_failures: recentWebhookFailures
            },
            infrastructure: {
                active_incidents: activeIncidents,
                ai_providers: providerHealth
            },
            timestamp: new Date().toISOString()
        }
    });

  } catch (error: any) {
    console.error("Ops Console Error:", error);
    return NextResponse.json({ error: error.message || "Failed to load ops metrics" }, { status: 500 });
  }
}
