import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { EventBus } from '@/lib/event-bus';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { users = 500, spike = true } = await req.json();

    // The Simulator generates a burst of activity directly via Supabase Realtime Channels.
    // In Phase 9 MVP, we will broadcast this directly so the Command Center can react instantly.
    
    // Simulate 50 active telemetry updates hitting the Event Bus instantly
    for (let i = 0; i < 50; i++) {
        const isSpike = spike && Math.random() > 0.9;
        const mockPayload = {
            queue_depth: Math.floor(Math.random() * (spike ? 5000 : 50)),
            ai_cogs: Math.random() * 5.0,
            error_budget_drop: isSpike ? 0.05 : 0,
            incident: isSpike ? 'AI_PROVIDER_FAILOVER' : undefined
        };

        // Broadcast directly to Supabase Realtime so UI responds instantly
        supabase.channel('demo_telemetry').send({
            type: 'broadcast',
            event: 'TELEMETRY_RECORDED',
            payload: mockPayload
        });

        // We use the event bus to also queue up the database side
        EventBus.emit('TELEMETRY_RECORDED', mockPayload).catch(() => {});
    }

    return NextResponse.json({ 
        success: true, 
        message: `Triggered 500-user simulation spike. Broadcasted 50 high-frequency payload events.`
    });

  } catch (error: any) {
    console.error("Demo Engine Error:", error);
    return NextResponse.json({ error: error.message || "Failed to trigger simulation" }, { status: 500 });
  }
}
