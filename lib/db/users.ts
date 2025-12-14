import { createClient } from '../supabase/server';
import type { User, UserProfile, UserProfileUpdate } from '../supabase/types';

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
