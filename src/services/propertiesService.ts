import { supabase, Property } from './supabase';

// Extended Property type with is_featured
export type PropertyWithFeatured = Property & {
  is_featured?: boolean;
};

/**
 * Get properties with filters
 */
export const getProperties = async (filters?: {
  type?: 'house' | 'land' | 'apartment';
  transaction?: 'sale' | 'rent';
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}) => {
  try {
    let query = supabase
      .from('properties')
      .select('*')
      .eq('status', 'active');

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.transaction) {
      query = query.eq('transaction', filters.transaction);
    }

    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }

    if (filters?.minPrice) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters?.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 20) - 1);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return { properties: data as Property[], error: null };
  } catch (error: any) {
    console.error('Get properties error:', error);
    return { properties: [], error };
  }
};

/**
 * Get featured properties
 */
export const getFeaturedProperties = async (limit: number = 5) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .eq('is_featured', true)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { properties: data as Property[], error: null };
  } catch (error: any) {
    console.error('Get featured properties error:', error);
    return { properties: [], error };
  }
};

/**
 * Search properties by text (full text search)
 */
export const searchProperties = async (query: string) => {
  try {
    if (!query.trim()) {
      return { properties: [], error: null };
    }

    const searchTerm = query.trim();

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return { properties: data as Property[], error: null };
  } catch (error: any) {
    console.error('Search properties error:', error);
    return { properties: [], error };
  }
};

/**
 * Get property by ID
 */
export const getPropertyById = async (propertyId: string) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (error) throw error;

    return { property: data as Property, error: null };
  } catch (error: any) {
    console.error('Get property by ID error:', error);
    return { property: null, error };
  }
};

/**
 * Create a new property
 */
export const createProperty = async (
  ownerId: string,
  propertyData: Omit<Property, 'id' | 'created_at'>
) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .insert({
        owner_id: ownerId,
        title: propertyData.title,
        description: propertyData.description,
        type: propertyData.type,
        transaction: propertyData.transaction,
        price: propertyData.price,
        currency: propertyData.currency || 'MZN',
        location: propertyData.location,
        city: propertyData.city,
        area_m2: propertyData.area_m2,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        parking: propertyData.parking,
        images: propertyData.images,
        status: propertyData.status || 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return { property: data as Property, error: null };
  } catch (error: any) {
    console.error('Create property error:', error);
    return { property: null, error };
  }
};

/**
 * Update property
 */
export const updateProperty = async (
  propertyId: string,
  updates: Partial<Property>
) => {
  try {
    const { error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', propertyId);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Update property error:', error);
    return { error };
  }
};

/**
 * Delete property (soft delete - sets status to inactive)
 */
export const deleteProperty = async (propertyId: string) => {
  try {
    const { error } = await supabase
      .from('properties')
      .update({ status: 'inactive' })
      .eq('id', propertyId);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Delete property error:', error);
    return { error };
  }
};

/**
 * Hard delete property (permanent removal)
 */
export const hardDeleteProperty = async (propertyId: string) => {
  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Hard delete property error:', error);
    return { error };
  }
};

/**
 * Upload property image to storage
 */
export const uploadImage = async (
  bucket: string,
  file: File | any, // File type for web, any for React Native
  path: string
) => {
  try {
    // For React Native, we need to handle the file differently
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return { url: urlData.publicUrl, error: null };
  } catch (error: any) {
    console.error('Upload image error:', error);
    return { url: null, error };
  }
};

/**
 * Upload property image from mobile (expo-image-picker)
 */
export const uploadPropertyImage = async (
  imageAsset: any, // ImagePickerAsset from expo-image-picker
  propertyId: string,
  imageIndex: number
): Promise<{ url: string | null; error: any }> => {
  try {
    if (!imageAsset?.uri) {
      return { url: null, error: 'Invalid image asset' };
    }

    // Determine file extension and content type
    const fileExtension = imageAsset.uri.split('.').pop()?.toLowerCase() || 'jpg';
    const contentType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

    // Generate unique filename
    const fileName = `${propertyId}/${Date.now()}_${imageIndex}.${fileExtension}`;

    // Fetch the image as blob
    const response = await fetch(imageAsset.uri);
    const blob = await response.blob();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('properties')
      .upload(fileName, blob, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('properties')
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl, error: null };
  } catch (error: any) {
    console.error('Upload property image error:', error);
    return { url: null, error };
  }
};

/**
 * Delete image from storage
 */
export const deleteImage = async (bucket: string, path: string) => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Delete image error:', error);
    return { error };
  }
};

/**
 * Get properties by user ID (alias for getMyProperties)
 */
export const getPropertiesByUserId = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { properties: data as Property[], error: null };
  } catch (error: any) {
    console.error('Get properties by user ID error:', error);
    return { properties: [], error };
  }
};

/**
 * Get my properties (alias for getPropertiesByUserId)
 */
export const getMyProperties = async (ownerId: string) => {
  return getPropertiesByUserId(ownerId);
};

/**
 * Format price in MZN
 */
export const formatPrice = (price: number, currency: string = 'MZN'): string => {
  const formatted = new Intl.NumberFormat('pt-MZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
  return `${formatted} ${currency}`;
};

/**
 * Get unique cities from properties
 */
export const getAvailableCities = async () => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('city')
      .eq('status', 'active');

    if (error) throw error;

    // Extract unique cities
    const cities = [...new Set(data.map(p => p.city))];
    
    return { cities, error: null };
  } catch (error: any) {
    console.error('Get available cities error:', error);
    return { cities: [], error };
  }
};
