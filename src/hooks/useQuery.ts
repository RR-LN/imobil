import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

// Query keys factory for consistent key management
export const queryKeys = {
  properties: {
    all: ['properties'] as const,
    lists: () => [...queryKeys.properties.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.properties.lists(), filters] as const,
    details: () => [...queryKeys.properties.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.properties.details(), id] as const,
    featured: () => [...queryKeys.properties.all, 'featured'] as const,
  },
  bookings: {
    all: ['bookings'] as const,
    lists: (filters?: Record<string, any>) => [...queryKeys.bookings.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.bookings.all, 'detail', id] as const,
  },
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
  },
  affiliate: {
    all: ['affiliate'] as const,
    stats: () => [...queryKeys.affiliate.all, 'stats'] as const,
    referrals: () => [...queryKeys.affiliate.all, 'referrals'] as const,
  },
  profile: {
    all: ['profile'] as const,
    detail: (id: string) => [...queryKeys.profile.all, id] as const,
  },
};

// Wrapper for Supabase queries with error handling
export const useSupabaseQuery = <T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options?: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<T, Error>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await queryFn();
      if (error) throw error;
      return data as T;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes default
    ...options,
  });
};

// Wrapper for Supabase mutations
export const useSupabaseMutation = <T, V>(
  mutationFn: (variables: V) => Promise<{ data: T | null; error: any }>,
  options?: UseMutationOptions<T, Error, V>
) => {
  const queryClient = useQueryClient();

  return useMutation<T, Error, V>({
    mutationFn: async (variables: V) => {
      const { data, error } = await mutationFn(variables);
      if (error) throw error;
      return data as T;
    },
    ...options,
    onSuccess: (...args) => {
      // Invalidate relevant queries on success
      queryClient.invalidateQueries();
      options?.onSuccess?.(...args);
    },
  });
};

// Hook to prefetch data
export const usePrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchProperties = async (filters?: Record<string, any>) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.properties.list(filters || {}),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'active')
          .limit(20);
        if (error) throw error;
        return data;
      },
    });
  };

  return { prefetchProperties };
};
