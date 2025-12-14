import { createClient } from '../supabase/server';
import type { UserStreak } from '../supabase/types';

/**
 * Get user's streak data
 */
export async function getUserStreak(userId: string): Promise<UserStreak | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        // Streak might not exist yet
        if (error.code === 'PGRST116') {
            return null;
        }
        console.error('Error getting user streak:', error);
        return null;
    }

    return data;
}

/**
 * Get community leaderboard by streak
 */
export async function getStreakLeaderboard(
    experienceId: string,
    limit: number = 10
): Promise<Array<{
    userId: string;
    displayName: string | null;
    avatarUrl: string | null;
    currentStreak: number;
    longestStreak: number;
}>> {
    const supabase = await createClient();

    // Get users in this experience with their streaks
    const { data, error } = await supabase
        .from('users')
        .select(`
      id,
      user_profiles (
        display_name,
        avatar_url
      ),
      user_streaks (
        current_streak,
        longest_streak
      )
    `)
        .eq('whop_experience_id', experienceId)
        .order('user_streaks(current_streak)', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error getting leaderboard:', error);
        return [];
    }

    return (data || []).map((user: any) => ({
        userId: user.id,
        displayName: user.user_profiles?.display_name || null,
        avatarUrl: user.user_profiles?.avatar_url || null,
        currentStreak: user.user_streaks?.current_streak || 0,
        longestStreak: user.user_streaks?.longest_streak || 0,
    }));
}
