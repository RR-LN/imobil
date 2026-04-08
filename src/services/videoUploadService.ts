import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import * as Haptics from 'expo-haptics';

export interface VideoUploadResult {
  url: string | null;
  thumbnailUrl: string | null;
  error: Error | null;
  path: string | null;
}

const VIDEOS_BUCKET = 'property-videos';
const THUMBNAILS_BUCKET = 'property-thumbnails';

/**
 * Request video permissions
 */
export const requestVideoPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

/**
 * Pick video from library
 */
export const pickVideo = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: true,
    quality: 1,
    videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  return result.assets[0];
};

/**
 * Upload video to Supabase Storage
 */
export const uploadVideo = async (
  uri: string,
  propertyId: string,
  userId: string
): Promise<VideoUploadResult> => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const filename = `${timestamp}-${randomString}.mp4`;
    const path = `${userId}/${propertyId}/${filename}`;

    // Fetch video as blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to Supabase
    const { data, error } = await supabase
      .storage
      .from(VIDEOS_BUCKET)
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'video/mp4',
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl: videoUrl } } = supabase
      .storage
      .from(VIDEOS_BUCKET)
      .getPublicUrl(data.path);

    // Generate and upload thumbnail (simplified - in real app, use video thumbnail generation)
    const thumbnailUrl = await generateVideoThumbnail(videoUrl);

    // Store in database
    const { error: dbError } = await supabase.from('property_videos').insert({
      property_id: propertyId,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl,
      uploaded_by: userId,
      filename: filename,
    });

    if (dbError) throw dbError;

    return {
      url: videoUrl,
      thumbnailUrl: thumbnailUrl,
      path: data.path,
      error: null,
    };
  } catch (error: any) {
    console.error('Video upload error:', error);
    return { url: null, thumbnailUrl: null, error, path: null };
  }
};

/**
 * Get videos for a property
 */
export const getPropertyVideos = async (propertyId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('property_videos')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Get videos error:', error);
    return [];
  }
};

/**
 * Delete video
 */
export const deleteVideo = async (videoId: string, path: string): Promise<{ error: Error | null }> => {
  try {
    // Delete from storage
    const { error: storageError } = await supabase
      .storage
      .from(VIDEOS_BUCKET)
      .remove([path]);

    if (storageError) throw storageError;

    // Delete from database
    const { error: dbError } = await supabase
      .from('property_videos')
      .delete()
      .eq('id', videoId);

    if (dbError) throw dbError;

    return { error: null };
  } catch (error: any) {
    return { error };
  }
};

/**
 * Mock thumbnail generation
 * In production, use: https://github.com/humphreydev/expo-video-thumbnails
 */
const generateVideoThumbnail = async (videoUrl: string): Promise<string | null> => {
  // For now, return a default thumbnail
  // In production, extract frame at 1s mark
  return null;
};

/**
 * Pick and upload video (complete flow)
 */
export const pickAndUploadVideo = async (
  propertyId: string,
  userId: string
): Promise<VideoUploadResult> => {
  const videoAsset = await pickVideo();
  
  if (!videoAsset) {
    return { url: null, thumbnailUrl: null, error: new Error('No video selected'), path: null };
  }

  return uploadVideo(videoAsset.uri, propertyId, userId);
};

export default {
  requestVideoPermissions,
  pickVideo,
  uploadVideo,
  getPropertyVideos,
  deleteVideo,
  pickAndUploadVideo,
};
