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

/**
 * Collaboration Presence Hub
 * Connects to a specific project session and tracks active editors/reviewers
 * using Supabase Presence.
 */
export function setupPresence(
  projectId: string, 
  userId: string, 
  onPresenceUpdate: (state: any) => void
) {
  const supabase = createClient();
  const room = supabase.channel(`presence:project-${projectId}`);

  room.on('presence', { event: 'sync' }, () => {
      const newState = room.presenceState();
      onPresenceUpdate(newState);
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', newPresences);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', leftPresences);
  })
  .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
          await room.track({
              user: userId,
              online_at: new Date().toISOString(),
          });
      }
  });

  return () => {
    room.untrack();
    supabase.removeChannel(room);
  };
}

