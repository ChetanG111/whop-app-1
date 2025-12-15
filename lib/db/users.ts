import { createClient } from '../supabase/server';
import type { User, UserProfile, UserProfileUpdate } from '../supabase/types';
import { getAvatarSignedUrl } from '../storage';

/**
 * Get or create a user based on Whop ID and Experience ID
 * Uses the database function that handles upsert logic
 */
export async function getOrCreateUser(
    whopId: string,
    whopExperienceId: string
): Promise<{
    id: string;
    whopId: string;
    whopExperienceId: string;
    role: 'member' | 'admin';
    isNew: boolean;
} | null> {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase.rpc('get_or_create_user' as any, {
        p_whop_id: whopId,
        p_whop_experience_id: whopExperienceId,
    });

    if (error) {
        console.error('Error getting/creating user:', error);
        return null;
    }

    if (!data || data.length === 0) {
        return null;
    }

    const user = data[0];
    return {
        id: user.id,
        whopId: user.whop_id,
        whopExperienceId: user.whop_experience_id,
        role: user.role,
        isNew: user.is_new,
    };
}

/**
 * Get user by their internal UUID
 */
export async function getUserById(userId: string): Promise<User | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error getting user:', error);
        return null;
    }

    return data;
}

/**
 * Get user profile by user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        // Profile might not exist yet
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error getting user profile:', error);
        return null;
    }

    return data;
}

/**
 * Create user profile
 */
export async function createUserProfile(
    userId: string,
    displayName: string
): Promise<UserProfile | null> {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
        .from('user_profiles')
        .insert({
            user_id: userId,
            display_name: displayName,
        } as any)
        .select()
        .single();

    if (error) {
        console.error('Error creating user profile:', error);
        return null;
    }

    return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
    userId: string,
    updates: UserProfileUpdate
): Promise<UserProfile | null> {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
        .from('user_profiles')
        .update(updates as any)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating user profile:', error);
        return null;
    }

    return data;
}

/**
 * Promote user to admin
 */
export async function promoteToAdmin(userId: string): Promise<boolean> {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase
        .from('users')
        .update({ role: 'admin' } as any)
        .eq('id', userId);

    if (error) {
        console.error('Error promoting user:', error);
        return false;
    }

    return true;
}

/**
 * Member data structure returned by getAllMembersByExperience
 */
export interface MemberData {
    userId: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    role: 'member' | 'admin';
    totalCheckins: number;
    currentStreak: number;
    longestStreak: number;
    lastCheckinDate: string | null;
    createdAt: string | null;
}

/**
 * Get all members for an experience with their stats
 * Returns all users (including those with 0 check-ins) with profile and streak data
 */
export async function getAllMembersByExperience(
    experienceId: string
): Promise<MemberData[]> {
    const supabase = await createClient();

    // First, get all users for this experience with their profiles and streaks
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
            id,
            whop_id,
            role,
            created_at,
            user_profiles (
                display_name,
                avatar_url
            ),
            user_streaks (
                current_streak,
                longest_streak,
                last_checkin_date
            )
        `)
        .eq('whop_experience_id', experienceId);

    if (usersError) {
        console.error('Error fetching members:', usersError);
        return [];
    }

    if (!users || users.length === 0) {
        return [];
    }

    // Get check-in counts for all users in this experience
    const userIds = users.map(u => u.id);
    const { data: checkinCounts, error: countError } = await supabase
        .from('checkins')
        .select('user_id')
        .in('user_id', userIds);

    if (countError) {
        console.error('Error fetching check-in counts:', countError);
    }

    // Count check-ins per user
    const countMap = new Map<string, number>();
    if (checkinCounts) {
        checkinCounts.forEach(c => {
            const userId = c.user_id as string;
            countMap.set(userId, (countMap.get(userId) || 0) + 1);
        });
    }

    // Map to MemberData structure and resolve avatar URLs
    const membersWithAvatars = await Promise.all(users.map(async user => {
        // Handle the nested profile data - can be array or object
        const profileData = Array.isArray(user.user_profiles)
            ? user.user_profiles[0]
            : user.user_profiles;
        const streakData = Array.isArray(user.user_streaks)
            ? user.user_streaks[0]
            : user.user_streaks;

        // Convert avatar path to signed URL if it exists and is a storage path
        let avatarUrl: string | null = profileData?.avatar_url || null;
        if (avatarUrl && !avatarUrl.startsWith('http://') && !avatarUrl.startsWith('https://') && !avatarUrl.startsWith('data:')) {
            const signedUrl = await getAvatarSignedUrl(avatarUrl);
            avatarUrl = signedUrl;
        }

        return {
            userId: user.id,
            username: user.whop_id, // Use whop_id as fallback username
            displayName: profileData?.display_name || null,
            avatarUrl,
            role: (user.role || 'member') as 'member' | 'admin',
            totalCheckins: countMap.get(user.id) || 0,
            currentStreak: streakData?.current_streak || 0,
            longestStreak: streakData?.longest_streak || 0,
            lastCheckinDate: streakData?.last_checkin_date || null,
            createdAt: user.created_at,
        };
    }));

    // Sort by last activity (most recent first), then by creation date
    return membersWithAvatars.sort((a, b) => {
        if (a.lastCheckinDate && b.lastCheckinDate) {
            return new Date(b.lastCheckinDate).getTime() - new Date(a.lastCheckinDate).getTime();
        }
        if (a.lastCheckinDate) return -1;
        if (b.lastCheckinDate) return 1;
        // Both have no check-ins, sort by creation date
        if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
    });
}
