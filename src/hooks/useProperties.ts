import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProperties, getFeaturedProperties, getPropertyById, searchProperties } from '../services/propertiesService';
import { Property } from '../services/supabase';
import { queryKeys } from './useQuery';

interface UsePropertiesOptions {
  type?: 'house' | 'land' | 'apartment';
  transaction?: 'sale' | 'rent';
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  enabled?: boolean;
}

// Hook for fetching properties with cache
export const useProperties = (options: UsePropertiesOptions = {}) => {
  const { type, transaction, city, minPrice, maxPrice, enabled = true } = options;

  const filters = { type, transaction, city, minPrice, maxPrice };

  return useQuery({
    queryKey: queryKeys.properties.list(filters),
    queryFn: async () => {
      const { properties, error } = await getProperties({
        ...filters,
        limit: 20,
      });
      if (error) throw error;
      return properties;
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });
};

// Hook for featured properties
export const useFeaturedProperties = (limit: number = 5) => {
  return useQuery({
    queryKey: queryKeys.properties.featured(),
    queryFn: async () => {
      const { properties, error } = await getFeaturedProperties(limit);
      if (error) throw error;
      return properties;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes for featured
  });
};

// Hook for single property
export const useProperty = (propertyId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.properties.detail(propertyId),
    queryFn: async () => {
      const { property, error } = await getPropertyById(propertyId);
      if (error) throw error;
      return property;
    },
    enabled: enabled && !!propertyId,
    staleTime: 1000 * 60 * 5,
  });
};

// Hook for property search
export const usePropertySearch = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['properties', 'search', query],
    queryFn: async () => {
      const { properties, error } = await searchProperties(query);
      if (error) throw error;
      return properties;
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes for search results
  });
};

// Hook for invalidating property cache
export const usePropertyActions = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
  };

  const invalidateDetail = (propertyId: string) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.properties.detail(propertyId) });
  };

  const prefetchProperty = async (propertyId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.properties.detail(propertyId),
      queryFn: async () => {
        const { property, error } = await getPropertyById(propertyId);
        if (error) throw error;
        return property;
      },
    });
  };

  return { invalidateAll, invalidateDetail, prefetchProperty };
};
