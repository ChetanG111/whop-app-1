/**
 * Supabase Storage utilities for checkin photos
 * Bucket: checkin-photos (private)
 * Path format: {experience_id}/{whop_id}/{YYYY-MM-DD}_{type}.{ext}
 */

import { createClient } from './supabase/server';

const BUCKET_NAME = 'checkin-photos';
const SIGNED_URL_EXPIRY = 3600; // 1 hour in seconds

/**
 * Generate the storage path for a checkin photo
 */
export function getCheckinPhotoPath(
    experienceId: string,
    whopId: string,
    checkinType: string,
    extension: string = 'jpg'
): string {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${experienceId}/${whopId}/${today}_${checkinType}.${extension}`;
}

/**
 * Upload a checkin photo to Supabase Storage
 * @returns The storage path (not URL) on success, null on failure
 */
export async function uploadCheckinPhoto(
    experienceId: string,
    whopId: string,
    fileData: Uint8Array,
    checkinType: string,
    contentType: string
): Promise<string | null> {
    try {
        const supabase = await createClient();

        // Extract extension from content type
        const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
        const path = getCheckinPhotoPath(experienceId, whopId, checkinType, ext);

        console.log(`Uploading to path: ${path}`);

        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(path, fileData, {
                contentType,
                upsert: true, // Allow overwriting if same day/type
            });

        if (error) {
            console.error('Supabase storage upload error:', error.message, error);
            return null;
        }

        console.log(`Upload successful: ${path}`);
        return path;
    } catch (err) {
        console.error('Exception in uploadCheckinPhoto:', err);
        return null;
    }
}

/**
 * Generate a signed URL for viewing a private photo
 * @param path The storage path (from photo_url column)
 * @param expiresIn Seconds until URL expires (default 1 hour)
 * @returns Signed URL or null on failure
 */
export async function getSignedUrl(
    path: string,
    expiresIn: number = SIGNED_URL_EXPIRY
): Promise<string | null> {
    if (!path) return null;

    const supabase = await createClient();

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(path, expiresIn);

    if (error) {
        console.error('Error creating signed URL:', error);
        return null;
    }

    return data.signedUrl;
}

/**
 * Delete a checkin photo from storage
 * @param path The storage path to delete
 */
export async function deleteCheckinPhoto(path: string): Promise<boolean> {
    if (!path) return true; // Nothing to delete

    const supabase = await createClient();

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

    if (error) {
        console.error('Error deleting checkin photo:', error);
        return false;
    }

    return true;
}

// ============================================================================
// Avatar Storage Functions
// ============================================================================

const AVATAR_BUCKET = 'avatars';

/**
 * Generate the storage path for an avatar
 */
export function getAvatarPath(
    experienceId: string,
    whopId: string,
    extension: string = 'jpg'
): string {
    return `${experienceId}/${whopId}/avatar.${extension}`;
}

/**
 * Upload an avatar to Supabase Storage
 * @returns The storage path (not URL) on success, null on failure
 */
export async function uploadAvatar(
    experienceId: string,
    whopId: string,
    fileData: Uint8Array,
    contentType: string
): Promise<string | null> {
    try {
        const supabase = await createClient();

        const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
        const path = getAvatarPath(experienceId, whopId, ext);

        console.log(`Uploading avatar to path: ${path}`);

        const { error } = await supabase.storage
            .from(AVATAR_BUCKET)
            .upload(path, fileData, {
                contentType,
                upsert: true, // Always overwrite existing avatar
            });

        if (error) {
            console.error('Avatar upload error:', error.message, error);
            return null;
        }

        console.log(`Avatar upload successful: ${path}`);
        return path;
    } catch (err) {
        console.error('Exception in uploadAvatar:', err);
        return null;
    }
}

/**
 * Generate a signed URL for viewing an avatar
 * @param path The storage path (from avatar_url column)
 */
export async function getAvatarSignedUrl(
    path: string,
    expiresIn: number = SIGNED_URL_EXPIRY
): Promise<string | null> {
    if (!path) return null;

    const supabase = await createClient();

    const { data, error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(path, expiresIn);

    if (error) {
        console.error('Error creating avatar signed URL:', error);
        return null;
    }

    return data.signedUrl;
}
