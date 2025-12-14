/**
 * Auto-generated types based on database schema
 * See architecture/database-schema.md for source
 */

// ============================================================================
// Enums
// ============================================================================

export type UserRole = 'member' | 'admin';

export type CheckinType = 'workout' | 'rest' | 'reflect';

export type WorkoutType =
    | 'push'
    | 'pull'
    | 'legs'
    | 'upper'
    | 'full_body'
    | 'cardio'
    | 'custom';

export type ReflectReason =
    | 'sick'
    | 'injury'
    | 'travel'
    | 'work'
    | 'family'
    | 'mental_health'
    | 'other';

// ============================================================================
// Table Types
// ============================================================================

export interface User {
    id: string;
    whop_id: string;
    whop_experience_id: string;
    role: UserRole;
    created_at: string;
    updated_at: string;
}

export interface UserProfile {
    id: string;
    user_id: string;
    display_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    theme_preference: 'light' | 'dark' | 'system';
    created_at: string;
    updated_at: string;
}

export interface Checkin {
    id: string;
    user_id: string;
    type: CheckinType;
    workout_type: WorkoutType | null;
    reflect_reason: ReflectReason | null;
    rest_reason: string | null;
    note: string;
    is_note_public: boolean;
    photo_url: string | null;
    is_photo_public: boolean;
    checkin_date: string;
    created_at: string;
}

export interface UserStreak {
    id: string;
    user_id: string;
    current_streak: number;
    longest_streak: number;
    last_checkin_date: string | null;
    updated_at: string;
}

// ============================================================================
// Insert/Update Types
// ============================================================================

export interface UserInsert {
    whop_id: string;
    whop_experience_id: string;
    role?: UserRole;
}

export interface UserProfileInsert {
    user_id: string;
    display_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    theme_preference?: 'light' | 'dark' | 'system';
}

export interface UserProfileUpdate {
    display_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    theme_preference?: 'light' | 'dark' | 'system';
}

export interface CheckinInsert {
    user_id: string;
    type: CheckinType;
    workout_type?: WorkoutType | null;
    reflect_reason?: ReflectReason | null;
    rest_reason?: string | null;
    note?: string;
    is_note_public?: boolean;
    photo_url?: string | null;
    is_photo_public?: boolean;
    checkin_date?: string;
}

export interface CheckinUpdate {
    note?: string;
    is_note_public?: boolean;
    is_photo_public?: boolean;
}

// ============================================================================
// Database Interface (for Supabase client typing)
// ============================================================================

export interface Database {
    public: {
        Tables: {
            users: {
                Row: User;
                Insert: UserInsert;
                Update: Partial<UserInsert>;
                Relationships: [];
            };
            user_profiles: {
                Row: UserProfile;
                Insert: UserProfileInsert;
                Update: UserProfileUpdate;
                Relationships: [];
            };
            checkins: {
                Row: Checkin;
                Insert: CheckinInsert;
                Update: CheckinUpdate;
                Relationships: [];
            };
            user_streaks: {
                Row: UserStreak;
                Insert: never; // Managed by trigger
                Update: never; // Managed by trigger
                Relationships: [];
            };
        };
        Functions: {
            get_or_create_user: {
                Args: {
                    p_whop_id: string;
                    p_whop_experience_id: string;
                };
                Returns: {
                    id: string;
                    whop_id: string;
                    whop_experience_id: string;
                    role: UserRole;
                    is_new: boolean;
                }[];
            };
            update_user_streak: {
                Args: {
                    p_user_id: string;
                };
                Returns: void;
            };
        };
        Views: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}

// ============================================================================
// Helper Types for Queries
// ============================================================================

/**
 * Checkin with joined user profile for feed display
 */
export interface CheckinWithProfile extends Checkin {
    users: {
        user_profiles: {
            display_name: string | null;
            avatar_url: string | null;
        } | null;
    } | null;
}

/**
 * User with profile for member list
 */
export interface UserWithProfile extends User {
    user_profiles: UserProfile | null;
    user_streaks: UserStreak | null;
}
