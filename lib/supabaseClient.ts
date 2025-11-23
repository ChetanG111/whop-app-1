import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Service role key for admin operations (may be undefined in local dev)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client for public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (has elevated permissions)
// Admin client for server-side operations (has elevated permissions)
// If the service role key is missing, fall back to the anon key with a warning.
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : (() => {
      console.warn(
        'SUPABASE_SERVICE_ROLE_KEY is not set. Falling back to anon key for supabaseAdmin. ' +
          'Elevated permissions will not be available.'
      );
      return createClient(supabaseUrl, supabaseAnonKey);
    })();

// ============================================================================
// PHOTO UPLOAD FUNCTIONS
// ============================================================================

/**
 * Validate photo file before upload
 * 
 * LIMITS:
 * - Max 10MB file size
 * - Only jpg/png allowed
 */
export function validatePhotoFile(file: File): { valid: boolean; error?: string } {
  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 10MB',
    };
  }

  // Check file type (jpg/png only)
  const allowedTypes = ['image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPEG and PNG images are allowed',
    };
  }

  return { valid: true };
}

/**
 * Upload photo to Supabase storage
 * 
 * @param file - File to upload
 * @param userId - Whop user ID (for organizing files)
 * @returns Object with url and error (if any)
 */
export async function uploadPhoto(
  file: File,
  userId: string
): Promise<{ url?: string; error?: string }> {
  try {
    // Validate file
    const validation = validatePhotoFile(file);
    if (!validation.valid) {
      return { error: validation.error };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${timestamp}-${randomString}.${fileExt}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('checkin-photos') // Bucket name
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { error: 'Failed to upload photo' };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('checkin-photos')
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl };
  } catch (error) {
    console.error('uploadPhoto error:', error);
    return { error: 'Failed to upload photo' };
  }
}

/**
 * Get public URL for a photo
 * Only returns URL if photo is marked as public
 * 
 * @param path - Storage path
 * @param isPublic - Whether photo is public
 * @returns Public URL or null
 */
export function getPhotoUrl(path: string, isPublic: boolean): string | null {
  if (!isPublic) {
    return null; // PRIVACY: Never expose private photo URLs
  }

  const { data } = supabase.storage.from('checkin-photos').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Generate signed upload URL (server-side only)
 * Allows client to upload directly to Supabase with time-limited URL
 * 
 * @param userId - Whop user ID
 * @returns Signed URL for upload
 */
export async function generateSignedUploadUrl(
  userId: string
): Promise<{ url?: string; path?: string; error?: string }> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileName = `${userId}/${timestamp}-${randomString}`;

    // Create signed URL (valid for 5 minutes)
    const { data, error } = await supabaseAdmin.storage
      .from('checkin-photos')
      .createSignedUploadUrl(fileName);

    if (error) {
      console.error('Signed URL error:', error);
      return { error: 'Failed to generate upload URL' };
    }

    return {
      url: data.signedUrl,
      path: data.path,
    };
  } catch (error) {
    console.error('generateSignedUploadUrl error:', error);
    return { error: 'Failed to generate upload URL' };
  }
}

/**
 * Delete photo from storage
 * 
 * @param path - Storage path
 */
export async function deletePhoto(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin.storage.from('checkin-photos').remove([path]);

    if (error) {
      console.error('Delete photo error:', error);
      return { success: false, error: 'Failed to delete photo' };
    }

    return { success: true };
  } catch (error) {
    console.error('deletePhoto error:', error);
    return { success: false, error: 'Failed to delete photo' };
  }
}
