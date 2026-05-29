'use server';
/**
 * AI Telemetry — Observability layer for all AI Command Center operations.
 * Non-blocking: all logging is fire-and-forget via Promise.resolve().then()
 * Never throws — designed to be safe to call from any route.
 */

import { createClient } from '@/utils/supabase/server';

export interface AITelemetryEvent {
  event_type: 'AI_QUERY' | 'AI_METRICS_FETCH' | 'AUTOMATION_EXECUTE' | 'REINDEX_JOB' | 'AI_ERROR';
  user_id: string;
  company_id: string;
  details: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
}

/**
 * Non-blocking telemetry log. Writes to ActivityLog table.
 * Fire-and-forget — never awaited by callers.
 */
export function logAIEvent(event: AITelemetryEvent): void {
  Promise.resolve().then(async () => {
    try {
      const supabase = await createClient();
      await supabase.from('ActivityLog').insert({
        user_name: event.user_id,
        action: event.event_type,
        details: event.details,
        company_id: event.company_id,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Silently ignore telemetry failures — never surface to user
    }
  });
}

/**
 * Simple in-memory rate limiter per user.
 * Allows maxRequests within windowMs milliseconds.
 * Resets on server restart (acceptable for internal tooling).
 */
const rateLimitMap = new Map<string, number[]>();

export function checkRateLimit(
  userId: string,
  maxRequests = 10,
  windowMs = 60_000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(userId) ?? []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);
  return { allowed: true, remaining: maxRequests - timestamps.length };
}

/**
 * Formats a duration in ms as a human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}
