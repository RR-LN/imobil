import { Property } from '../services/supabase';

export interface SearchFilters {
  type?: 'house' | 'apartment' | 'land';
  transaction?: 'sale' | 'rent';
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minArea?: number;
  maxArea?: number;
  sortBy?: 'newest' | 'oldest' | 'priceLow' | 'priceHigh';
}

export function applyFilters(properties: Property[], filters: SearchFilters): Property[] {
  let result = [...properties];

  if (filters.type) {
    result = result.filter((p) => p.type === filters.type);
  }

  if (filters.transaction) {
    result = result.filter((p) => p.transaction === filters.transaction);
  }

  if (filters.city) {
    const cityLower = filters.city.toLowerCase();
    result = result.filter((p) => p.city.toLowerCase().includes(cityLower));
  }

  if (filters.minPrice !== undefined) {
    result = result.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    result = result.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.minBedrooms !== undefined) {
    result = result.filter((p) => (p.bedrooms ?? 0) >= filters.minBedrooms!);
  }

  if (filters.maxBedrooms !== undefined) {
    result = result.filter((p) => (p.bedrooms ?? 0) <= filters.maxBedrooms!);
  }

  if (filters.minBathrooms !== undefined) {
    result = result.filter((p) => (p.bathrooms ?? 0) >= filters.minBathrooms!);
  }

  if (filters.maxBathrooms !== undefined) {
    result = result.filter((p) => (p.bathrooms ?? 0) <= filters.maxBathrooms!);
  }

  if (filters.minArea !== undefined) {
    result = result.filter((p) => p.area_m2 >= filters.minArea!);
  }

  if (filters.maxArea !== undefined) {
    result = result.filter((p) => p.area_m2 <= filters.maxArea!);
  }

  if (filters.sortBy) {
    switch (filters.sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'priceLow':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'priceHigh':
        result.sort((a, b) => b.price - a.price);
        break;
    }
  }

  return result;
}

export function getFilterCount(filters: SearchFilters): number {
  let count = 0;
  if (filters.type) count++;
  if (filters.transaction) count++;
  if (filters.city) count++;
  if (filters.minPrice !== undefined) count++;
  if (filters.maxPrice !== undefined) count++;
  if (filters.minBedrooms !== undefined) count++;
  if (filters.maxBedrooms !== undefined) count++;
  if (filters.minBathrooms !== undefined) count++;
  if (filters.maxBathrooms !== undefined) count++;
  if (filters.minArea !== undefined) count++;
  if (filters.maxArea !== undefined) count++;
  return count;
}

export const DEFAULT_FILTERS: SearchFilters = {
  sortBy: 'newest',
};
