import { createClient } from '../supabase/server';
import type {
    Checkin,
    CheckinInsert,
    CheckinUpdate,
    CheckinWithProfile,
    CheckinType,
    WorkoutType,
    ReflectReason
} from '../supabase/types';

/**
 * Create a new check-in
 */
export async function createCheckin(
    userId: string,
    data: {
        type: CheckinType;
        workoutType?: WorkoutType;
        reflectReason?: ReflectReason;
        restReason?: string;
        note?: string;
        isNotePublic?: boolean;
        photoUrl?: string;
        isPhotoPublic?: boolean;
    }
): Promise<Checkin | null> {
    const supabase = await createClient();

    const insertData: CheckinInsert = {
        user_id: userId,
        type: data.type,
        workout_type: data.workoutType || null,
        reflect_reason: data.reflectReason || null,
        rest_reason: data.restReason || null,
        note: data.note || '',
        is_note_public: data.isNotePublic || false,
        photo_url: data.photoUrl || null,
        is_photo_public: data.isPhotoPublic || false,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: checkin, error } = await supabase
        .from('checkins')
        .insert(insertData as any)
        .select()
        .single();

    if (error) {
        console.error('Error creating check-in:', error);
        return null;
    }

    // Trigger streak update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.rpc('update_user_streak' as any, { p_user_id: userId });

    return checkin;
}

/**
 * Get today's check-in for a user (to prevent duplicates)
 */
export async function getTodayCheckin(userId: string): Promise<Checkin | null> {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('checkin_date', today)
        .single();

    if (error) {
        // No check-in for today is not an error
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error getting today check-in:', error);
        return null;
    }

    return data;
}

/**
 * Get user's check-in history
 */
export async function getUserCheckins(
    userId: string,
    limit: number = 50
): Promise<Checkin[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', userId)
        .order('checkin_date', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error getting user check-ins:', error);
        return [];
    }

    return data || [];
}

/**
 * Get public feed for a community
 */
export async function getPublicFeed(
    experienceId: string,
    limit: number = 50
): Promise<CheckinWithProfile[]> {
    const supabase = await createClient();

    // First get users in this experience
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('whop_experience_id', experienceId);

    if (usersError || !users) {
        console.error('Error getting users:', usersError);
        return [];
    }

    const userIds = users.map(u => u.id);

    if (userIds.length === 0) {
        return [];
    }

    // Get public check-ins from these users
    const { data, error } = await supabase
        .from('checkins')
        .select(`
      *,
      users (
        user_profiles (
          display_name,
          avatar_url
        )
      )
    `)
        .in('user_id', userIds)
        .or('is_note_public.eq.true,is_photo_public.eq.true')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error getting public feed:', error);
        return [];
    }

    return (data as CheckinWithProfile[]) || [];
}

/**
 * Update a check-in (note visibility, photo visibility)
 */
export async function updateCheckin(
    checkinId: string,
    userId: string,
    updates: CheckinUpdate
): Promise<Checkin | null> {
    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
        .from('checkins')
        .update(updates as any)
        .eq('id', checkinId)
        .eq('user_id', userId) // Ensure user owns this check-in
        .select()
        .single();

    if (error) {
        console.error('Error updating check-in:', error);
        return null;
    }

    return data;
}

/**
 * Delete a check-in
 */
export async function deleteCheckin(
    checkinId: string,
    userId: string,
    isAdmin: boolean = false
): Promise<boolean> {
    const supabase = await createClient();

    let query = supabase
        .from('checkins')
        .delete()
        .eq('id', checkinId);

    // If not admin, must be owner
    if (!isAdmin) {
        query = query.eq('user_id', userId);
    }

    const { error } = await query;

    if (error) {
        console.error('Error deleting check-in:', error);
        return false;
    }

    return true;
}
