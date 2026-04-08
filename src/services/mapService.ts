import { supabase } from './supabase';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GeocodeResult {
  coordinates: Coordinates | null;
  address: string;
  error: Error | null;
}

/**
 * Geocode an address to coordinates
 * In production, use Google Geocoding API or similar
 */
export const geocodeAddress = async (address: string): Promise<GeocodeResult> => {
  try {
    // Mock implementation - would integrate with Google Geocoding API
    // Example: https://maps.googleapis.com/maps/api/geocode/json?address=
    
    // For now, return default Maputo coordinates
    return {
      coordinates: {
        latitude: -25.9692 + (Math.random() - 0.5) * 0.02,
        longitude: 32.5732 + (Math.random() - 0.5) * 0.02,
      },
      address,
      error: null,
    };
  } catch (error: any) {
    return {
      coordinates: null,
      address,
      error,
    };
  }
};

/**
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (
  coordinates: Coordinates
): Promise<string | null> => {
  try {
    // Would integrate with Google Reverse Geocoding API
    return 'Maputo, Mozambique';
  } catch (error) {
    return null;
  }
};

/**
 * Get properties within a region (bounding box)
 */
export const getPropertiesInRegion = async (
  northEast: Coordinates,
  southWest: Coordinates
) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    return { properties: data || [], error: null };
  } catch (error: any) {
    return { properties: [], error };
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Get directions URL for external maps app
 */
export const getDirectionsUrl = (
  start: Coordinates,
  end: Coordinates,
  app: 'google' | 'apple' | 'waze' = 'google'
): string => {
  const startStr = `${start.latitude},${start.longitude}`;
  const endStr = `${end.latitude},${end.longitude}`;

  switch (app) {
    case 'apple':
      return `maps://app?saddr=${startStr}&daddr=${endStr}`;
    case 'waze':
      return `waze://?ll=${end.latitude},${end.longitude}&navigate=yes`;
    case 'google':
    default:
      return `https://www.google.com/maps/dir/?api=1&origin=${startStr}&destination=${endStr}`;
  }
};

/**
 * Get nearby properties (requires location permission)
 */
export const getNearbyProperties = async (
  coordinates: Coordinates,
  radius: number = 5 // km
) => {
  try {
    // In production, use PostGIS or Supabase geospatial queries
    const { data, error } = await supabase.rpc('nearby_properties', {
      lat: coordinates.latitude,
      lng: coordinates.longitude,
      radius_km: radius,
    });

    if (error) throw error;

    return { properties: data || [], error: null };
  } catch (error: any) {
    return { properties: [], error };
  }
};

/**
 * Generate cluster data for markers
 */
export const generateClusters = (
  properties: any[],
  zoom: number
): { id: string; coordinates: Coordinates; count: number }[] => {
  // Simple clustering - group nearby properties
  // In production, use supercluster library
  
  const clusters: { [key: string]: { coordinates: Coordinates; count: number } } = {};
  
  properties.forEach((property) => {
    const lat = -25.9692 + Math.random() * 0.1;
    const lng = 32.5732 + Math.random() * 0.1;
    const key = `${Math.floor(lat * 100)},${Math.floor(lng * 100)}`;
    
    if (clusters[key]) {
      clusters[key].count++;
    } else {
      clusters[key] = {
        coordinates: { latitude: lat, longitude: lng },
        count: 1,
      };
    }
  });

  return Object.entries(clusters).map(([id, cluster]) => ({
    id,
    coordinates: cluster.coordinates,
    count: cluster.count,
  }));
};
