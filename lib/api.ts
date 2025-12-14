/**
 * API service for making requests to backend endpoints
 * This centralizes all API calls and handles errors consistently
 */

import type {
    CheckinType,
    WorkoutType,
    ReflectReason,
    Checkin,
    CheckinWithProfile
} from './supabase/types';

// ============================================================================
// Types
// ============================================================================

interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

interface UserContext {
    whopId: string;
    whopExperienceId: string;
}

interface ProfileData {
    user: {
        id: string;
        whopId: string;
        role: 'member' | 'admin';
        isNew: boolean;
    };
    profile: {
        displayName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        themePreference: 'light' | 'dark' | 'system';
    } | null;
    streak: {
        current: number;
        longest: number;
        lastCheckinDate: string | null;
    } | null;
}

interface CreateCheckinData {
    type: CheckinType;
    workoutType?: WorkoutType;
    reflectReason?: ReflectReason;
    restReason?: string;
    note?: string;
    isNotePublic?: boolean;
    photoUrl?: string;
    isPhotoPublic?: boolean;
}

// ============================================================================
// Helper
// ============================================================================

async function apiRequest<T>(
    url: string,
    options?: RequestInit
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        const data = await response.json();

        if (!response.ok) {
            return { data: null, error: data.error || 'Request failed' };
        }

        return { data, error: null };
    } catch (error) {
        console.error('API request failed:', error);
        return { data: null, error: 'Network error' };
    }
}

// ============================================================================
// Profile API
// ============================================================================

export async function getProfile(ctx: UserContext): Promise<ApiResponse<ProfileData>> {
    const params = new URLSearchParams({
        whopId: ctx.whopId,
        whopExperienceId: ctx.whopExperienceId,
    });

    return apiRequest<ProfileData>(`/api/profile?${params}`);
}

export async function updateProfile(
    ctx: UserContext,
    updates: {
        displayName?: string;
        bio?: string;
        avatarUrl?: string;
        themePreference?: 'light' | 'dark' | 'system';
    }
): Promise<ApiResponse<{ profile: ProfileData['profile'] }>> {
    return apiRequest('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
            ...ctx,
            ...updates,
        }),
    });
}

// ============================================================================
// Checkins API
// ============================================================================

export async function createCheckin(
    ctx: UserContext,
    data: CreateCheckinData
): Promise<ApiResponse<{ checkin: Checkin }>> {
    return apiRequest('/api/checkins', {
        method: 'POST',
        body: JSON.stringify({
            ...ctx,
            ...data,
        }),
    });
}

export async function getMyCheckins(
    ctx: UserContext,
    limit: number = 50
): Promise<ApiResponse<{ checkins: Checkin[] }>> {
    const params = new URLSearchParams({
        whopId: ctx.whopId,
        whopExperienceId: ctx.whopExperienceId,
        limit: limit.toString(),
    });

    return apiRequest(`/api/checkins?${params}`);
}

export async function updateCheckin(
    ctx: UserContext,
    checkinId: string,
    updates: {
        isNotePublic?: boolean;
        isPhotoPublic?: boolean;
        note?: string;
    }
): Promise<ApiResponse<{ checkin: Checkin }>> {
    return apiRequest(`/api/checkins/${checkinId}`, {
        method: 'PATCH',
        body: JSON.stringify({
            ...ctx,
            ...updates,
        }),
    });
}

export async function deleteCheckin(
    ctx: UserContext,
    checkinId: string
): Promise<ApiResponse<{ success: boolean }>> {
    const params = new URLSearchParams({
        whopId: ctx.whopId,
        whopExperienceId: ctx.whopExperienceId,
    });

    return apiRequest(`/api/checkins/${checkinId}?${params}`, {
        method: 'DELETE',
    });
}

// ============================================================================
// Feed API
// ============================================================================

export async function getPublicFeed(
    experienceId: string,
    limit: number = 50
): Promise<ApiResponse<{ feed: CheckinWithProfile[] }>> {
    const params = new URLSearchParams({
        experienceId,
        limit: limit.toString(),
    });

    return apiRequest(`/api/feed?${params}`);
}

// ============================================================================
// Conversion helpers (DB format <-> Frontend format)
// ============================================================================

/**
 * Convert a database checkin to frontend LogEntry format
 */
export function checkinToLogEntry(checkin: Checkin | CheckinWithProfile, username?: string): {
    id: string;
    type: string;
    workoutType?: string;
    reason?: string;
    note: string;
    isPublicNote: boolean;
    photoUrl?: string;
    isPublicPhoto: boolean;
    username: string;
    timestamp: Date;
    imageUrl?: string;
} {
    const displayName = 'users' in checkin && checkin.users?.user_profiles
        ? (checkin.users.user_profiles.display_name || username || 'User')
        : (username || 'User');

    return {
        id: checkin.id, // Use string UUID directly
        type: checkin.type.charAt(0).toUpperCase() + checkin.type.slice(1), // 'workout' -> 'Workout'
        workoutType: checkin.workout_type
            ? checkin.workout_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            : undefined,
        reason: checkin.reflect_reason || checkin.rest_reason || undefined,
        note: checkin.note,
        isPublicNote: checkin.is_note_public,
        photoUrl: checkin.photo_url || undefined,
        isPublicPhoto: checkin.is_photo_public,
        username: displayName,
        timestamp: new Date(checkin.created_at),
        imageUrl: checkin.photo_url || undefined,
    };
}

/**
 * Convert frontend log type to database format
 */
export function logTypeToCheckinType(logType: string): CheckinType {
    return logType.toLowerCase() as CheckinType;
}

/**
 * Convert frontend workout type to database format
 */
export function workoutTypeToDbFormat(workoutType: string): WorkoutType {
    return workoutType.toLowerCase().replace(' ', '_') as WorkoutType;
}
