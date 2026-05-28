import { createClient } from '@/utils/supabase/client';

/**
 * Enterprise Realtime Hub
 * Sets up a listener on a specific Project or Objective channel to sync
 * comments, stage transitions, and AI generation statuses.
 */
export function setupRealtimeSubscription(channelName: string, onUpdate: (payload: any) => void) {
  const supabase = createClient();

  // Create a channel
  const channel = supabase.channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'Comment' }, // Could be scoped to 'table: *' for wider sync
      (payload) => {
        console.log(`Realtime update received on ${channelName}:`, payload);
        onUpdate(payload);
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Successfully connected to realtime channel: ${channelName}`);
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
