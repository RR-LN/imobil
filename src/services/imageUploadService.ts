import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import * as Haptics from 'expo-haptics';

export type ImageSource = 'camera' | 'library';

export interface UploadOptions {
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface UploadResult {
  url: string | null;
  error: Error | null;
  path: string | null;
}

const BUCKET_NAME = 'chat-attachments';

/**
 * Request permissions for camera and photo library
 */
export const requestImagePermissions = async (): Promise<{
  camera: boolean;
  library: boolean;
}> => {
  const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
  const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  
  return {
    camera: cameraPermission.status === 'granted',
    library: libraryPermission.status === 'granted',
  };
};

/**
 * Check current permission status
 */
export const checkImagePermissions = async (): Promise<{
  camera: boolean;
  library: boolean;
}> => {
  const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
  const libraryPermission = await ImagePicker.getMediaLibraryPermissionsAsync();
  
  return {
    camera: cameraPermission.status === 'granted',
    library: libraryPermission.status === 'granted',
  };
};

/**
 * Pick image from camera
 */
export const takePhoto = async (options?: UploadOptions): Promise<ImagePicker.ImagePickerResult> => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  
  return ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: options?.quality ?? 0.8,
    base64: false,
  });
};

/**
 * Pick image from library
 */
export const pickFromLibrary = async (options?: UploadOptions): Promise<ImagePicker.ImagePickerResult> => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
  return ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: options?.quality ?? 0.8,
    base64: false,
    allowsMultipleSelection: false,
  });
};

/**
 * Upload image to Supabase Storage
 */
export const uploadImage = async (
  uri: string,
  filename?: string,
  folder?: string
): Promise<UploadResult> => {
  try {
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { url: null, error: new Error('Not authenticated'), path: null };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const finalFilename = filename || `${timestamp}-${randomString}.${ext}`;
    const path = folder 
      ? `${folder}/${finalFilename}` 
      : `${userData.user.id}/${finalFilename}`;

    // Convert URI to blob (web) or File (native)
    let file: Blob | File;
    
    if (Platform.OS === 'web') {
      // Web: fetch and convert to blob
      const response = await fetch(uri);
      file = await response.blob();
    } else {
      // Native: Read file as blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Convert blob to File-like object
      file = new File([blob], finalFilename, { type: `image/${ext}` });
    }

    // Upload to Supabase
    const { data, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return { url: publicUrl, error: null, path: data.path };
  } catch (error: any) {
    console.error('Upload error:', error);
    return { url: null, error, path: null };
  }
};

/**
 * Delete uploaded image
 */
export const deleteImage = async (path: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error };
  }
};

/**
 * Upload multiple images
 */
export const uploadMultipleImages = async (
  uris: string[],
  folder?: string
): Promise<Array<UploadResult & { originalUri: string }>> => {
  const uploads = await Promise.all(
    uris.map(async (uri) => {
      const result = await uploadImage(uri, undefined, folder);
      return { ...result, originalUri: uri };
    })
  );
  return uploads;
};

/**
 * Complete flow: pick and upload image
 */
export const pickAndUploadImage = async (
  source: ImageSource,
  folder?: string
): Promise<UploadResult> => {
  const result = source === 'camera' 
    ? await takePhoto()
    : await pickFromLibrary();

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return { url: null, error: new Error('No image selected'), path: null };
  }

  const { uri } = result.assets[0];
  return uploadImage(uri, undefined, folder);
};

/**
 * Get image dimensions and optimize
 */
export const getImageInfo = async (uri: string): Promise<{
  width: number;
  height: number;
  size?: number;
} | null> => {
  try {
    // For native platforms
    if (Platform.OS !== 'web') {
      const { Image } = await import('react-native');
      return new Promise((resolve) => {
        Image.getSize(uri, (width, height) => resolve({ width, height }));
      });
    }
    
    return null;
  } catch {
    return null;
  }
};

export default {
  requestImagePermissions,
  checkImagePermissions,
  takePhoto,
  pickFromLibrary,
  uploadImage,
  deleteImage,
  uploadMultipleImages,
  pickAndUploadImage,
  getImageInfo,
};
