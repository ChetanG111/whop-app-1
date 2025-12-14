// ============================================================================
// Backward compatible type exports (for existing code)
// ============================================================================

import type { Database } from './database.types';

// Enum types
export type CheckinType = Database['public']['Enums']['checkin_type'];
export type WorkoutType = Database['public']['Enums']['workout_type'];
export type ReflectReason = Database['public']['Enums']['reflect_reason'];
export type UserRole = Database['public']['Enums']['user_role'];

// Table Row types
export type Checkin = Database['public']['Tables']['checkins']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type UserStreak = Database['public']['Tables']['user_streaks']['Row'];

// Table Insert types
export type CheckinInsert = Database['public']['Tables']['checkins']['Insert'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];

// Table Update types  
export type CheckinUpdate = Database['public']['Tables']['checkins']['Update'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

// Joined types for feed display
export interface CheckinWithProfile extends Checkin {
    users: {
        user_profiles: {
            display_name: string | null;
            avatar_url: string | null;
        } | null;
    } | null;
}

export interface UserWithProfile extends User {
    user_profiles: UserProfile | null;
    user_streaks: UserStreak | null;
}

// Re-export Database for convenience
export type { Database };
