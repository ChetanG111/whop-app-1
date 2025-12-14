// Supabase clients
export { createClient as createBrowserClient, getSupabaseClient } from './client';
export { createClient as createServerClient } from './server';

// Types
export type {
    Database,
    User,
    UserProfile,
    Checkin,
    UserStreak,
    UserRole,
    CheckinType,
    WorkoutType,
    ReflectReason,
    CheckinInsert,
    CheckinUpdate,
    UserProfileUpdate,
    CheckinWithProfile,
    UserWithProfile,
} from './database.types';
