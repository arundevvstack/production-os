'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export type TelemetryData = {
    active_tenants: number;
    queue_depth: number;
    error_budget: number;
    ai_cogs: number;
    last_event?: string;
    incident_active?: boolean;
};

// Initial state matching the static Command Center setup
const INITIAL_STATE: TelemetryData = {
    active_tenants: 124,
    queue_depth: 0,
    error_budget: 99.8,
    ai_cogs: 1450.50,
};

export function useThrottledTelemetry(throttleMs: number = 250) {
    const [telemetry, setTelemetry] = useState<TelemetryData>(INITIAL_STATE);
    const bufferRef = useRef<any[]>([]);
    const supabase = createClient();

    useEffect(() => {
        // 1. Subscribe to the Supabase Realtime channel
        const channel = supabase.channel('demo_telemetry');

        channel.on('broadcast', { event: 'TELEMETRY_RECORDED' }, (payload) => {
            // Push incoming high-frequency events to the buffer, DO NOT set state yet
            bufferRef.current.push(payload.payload);
        }).subscribe();

        // 2. Set up the Aggregator Loop
        const interval = setInterval(() => {
            if (bufferRef.current.length > 0) {
                // Process all events in the buffer
                const events = [...bufferRef.current];
                bufferRef.current = []; // clear buffer

                setTelemetry((prev) => {
                    const nextState = { ...prev };
                    
                    for (const evt of events) {
                        // Aggregate deltas from the payloads
                        if (evt.queue_depth !== undefined) nextState.queue_depth = evt.queue_depth;
                        if (evt.ai_cogs !== undefined) nextState.ai_cogs += evt.ai_cogs;
                        if (evt.error_budget_drop) nextState.error_budget -= evt.error_budget_drop;
                        
                        if (evt.incident) {
                            nextState.incident_active = true;
                            nextState.last_event = evt.incident;
                        }
                    }
                    
                    // Safety bounds
                    if (nextState.error_budget < 0) nextState.error_budget = 0;
                    
                    return nextState;
                });
            }
        }, throttleMs);

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [supabase, throttleMs]);

    return telemetry;
}
