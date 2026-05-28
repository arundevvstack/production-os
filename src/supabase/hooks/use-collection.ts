'use client';

import { useState, useEffect, useRef } from 'react';
import { useSupabase } from '@/supabase/provider';

export interface UseSupabaseCollectionResult<T> {
  data: T[] | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSupabaseCollection<T = any>(
  table: string,
  queryConfig?: {
    filters?: { column: string; operator: string; value: any }[];
    where?: Record<string, any>;
    orderBy?: { column: string; ascending?: boolean } | Record<string, 'asc' | 'desc'>;
    limit?: number;
  }
): UseSupabaseCollectionResult<T> {
  const { supabase } = useSupabase();
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  // Granular serialization to guarantee reference stability of input parameters
  const serializedFilters = queryConfig?.filters ? JSON.stringify(queryConfig.filters) : '';
  const serializedWhere = queryConfig?.where ? JSON.stringify(queryConfig.where) : '';
  const serializedOrderBy = queryConfig?.orderBy ? JSON.stringify(queryConfig.orderBy) : '';
  const limit = queryConfig?.limit;

  useEffect(() => {
    // Keep reference to abort controller or current fetch state to prevent state update races
    let active = true;

    const fetchData = async () => {
      if (!active) return;
      setIsLoading(true);
      try {
        let query = supabase.from(table).select('*');

        // Apply filters (new syntax)
        if (queryConfig?.filters) {
          queryConfig.filters.forEach((f) => {
            query = query.filter(f.column, f.operator as any, f.value);
          });
        }

        // Apply where clauses (legacy/common syntax)
        if (queryConfig?.where) {
          Object.entries(queryConfig.where).forEach(([column, value]) => {
            if (value !== undefined && value !== null && value !== 'undefined' && value !== 'null') {
              query = query.eq(column, value);
            }
          });
        }

        // Apply order guidelines
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
        }
      } catch (err: any) {
        if (active) {
          setError(err);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // Set up real-time subscription with a single stable channel per component lifecycle
    const channelId = `${table}_changes_${Math.random().toString(36).substring(7)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table },
        () => {
          if (active) {
            fetchData(); // Securely re-fetch fresh data on postgres update events
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, table, serializedFilters, serializedWhere, serializedOrderBy, limit, refetchTrigger]);

  return { data, isLoading, error, refetch };
}
