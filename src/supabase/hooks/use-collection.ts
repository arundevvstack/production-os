'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/supabase/provider';

export interface UseSupabaseCollectionResult<T> {
  data: T[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Global broadcast: call this after any mutation to instantly wake up
 * all useSupabaseCollection hooks listening to that table.
 * Usage: broadcastTableUpdate('Prospect')
 */
export function broadcastTableUpdate(table: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('dp:table-update', { detail: { table } }));
  }
}

export function useSupabaseCollection<T = any>(
  table: string,
  queryConfig?: {
    filters?: { column: string; operator: string; value: any }[];
    where?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean } | Record<string, 'asc' | 'desc'>;
    limit?: number;
    select?: string;
    /** Poll interval in ms. Default: 30000 (30s). Set to 0 to disable. */
    pollInterval?: number;
  }
): UseSupabaseCollectionResult<T> {
  const { supabase } = useSupabase();
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  // Granular serialization to guarantee reference stability of input parameters
  const serializedFilters = queryConfig?.filters ? JSON.stringify(queryConfig.filters) : '';
  const serializedWhere = queryConfig?.where ? JSON.stringify(queryConfig.where) : '';
  const serializedOrderBy = queryConfig?.orderBy ? JSON.stringify(queryConfig.orderBy) : '';
  const limit = queryConfig?.limit;
  const pollInterval = queryConfig?.pollInterval ?? 30000;

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      if (!active) return;
      // Only show loading spinner on initial load, not on background refetches
      setIsLoading(prev => prev);
      try {
        let query = supabase.from(table).select(queryConfig?.select || '*');

        if (queryConfig?.filters) {
          queryConfig.filters.forEach((f) => {
            query = query.filter(f.column, f.operator as any, f.value);
          });
        }

        if (queryConfig?.where) {
          Object.entries(queryConfig.where).forEach(([column, value]) => {
            if (value !== undefined && value !== null && value !== 'undefined' && value !== 'null') {
              query = query.eq(column, value);
            }
          });
        }

        if (queryConfig?.orderBy) {
          const orderByVal = queryConfig.orderBy as any;
          if (typeof orderByVal === 'object' && 'column' in orderByVal) {
            query = query.order(orderByVal.column, {
              ascending: orderByVal.ascending ?? true,
            });
          } else {
            Object.entries(orderByVal).forEach(([column, order]) => {
              query = query.order(column, {
                ascending: (order as any) === 'asc',
              });
            });
          }
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data: result, error: fetchError } = await query;
        if (fetchError) {
          console.error(`Supabase fetch error [${table}]:`, {
            ...fetchError,
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint,
            code: fetchError.code
          });
          throw fetchError;
        }

        if (active) {
          setData(result as T[]);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (active) {
          setError(err);
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    setIsLoading(true);
    fetchData();

    // 1. Realtime postgres_changes subscription (works when replication is enabled)
    const channelId = `${table}_rt_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        () => {
          if (active) fetchData();
        }
      )
      .subscribe();

    // 2. Polling fallback: ensures data is fresh even if realtime events don't fire
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    if (pollInterval > 0) {
      pollTimer = setInterval(() => {
        if (active && !document.hidden) fetchData();
      }, pollInterval);
    }

    // 3. Page visibility: refetch immediately when user returns to the tab
    const handleVisibilityChange = () => {
      if (!document.hidden && active) fetchData();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Global broadcast: refetch when any code calls broadcastTableUpdate(table)
    const handleBroadcast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.table === table && active) {
        fetchData();
      }
    };
    window.addEventListener('dp:table-update', handleBroadcast);

    return () => {
      active = false;
      supabase.removeChannel(channel);
      if (pollTimer) clearInterval(pollTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('dp:table-update', handleBroadcast);
    };
  }, [supabase, table, serializedFilters, serializedWhere, serializedOrderBy, limit, pollInterval, refetchTrigger]);

  return { data, isLoading, error, refetch };
}
