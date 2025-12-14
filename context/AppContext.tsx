import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, LogEntry } from '../types';
import { useDarkMode, useBodyScrollLock } from '../hooks';

// ============================================================================
// Types
// ============================================================================

interface AppState {
    // User
    userId: string;
    username: string;
    experienceId: string;
    isCoachMode: boolean;

    // Profile
    userProfile: UserProfile;
    setUserProfile: (profile: UserProfile) => void;

    // Data
    feedItems: LogEntry[];
    setFeedItems: React.Dispatch<React.SetStateAction<LogEntry[]>>;
    myActivities: LogEntry[];
    setMyActivities: React.Dispatch<React.SetStateAction<LogEntry[]>>;

    // Theme
    isDarkMode: boolean;
    toggleTheme: () => void;
}

interface AppProviderProps {
    children: ReactNode;
    userId?: string;
    username?: string;
    experienceId?: string;
    isCoachMode?: boolean;
}

// ============================================================================
// Context
// ============================================================================

const AppContext = createContext<AppState | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function AppProvider({
    children,
    userId = '',
    username = 'User',
    experienceId = '',
    isCoachMode = false,
}: AppProviderProps) {
    // User Profile
    const [userProfile, setUserProfile] = useState<UserProfile>({
        name: username,
        bio: '',
        avatar: '',
    });

    // Data - will be loaded from Supabase later
    const [feedItems, setFeedItems] = useState<LogEntry[]>([]);
    const [myActivities, setMyActivities] = useState<LogEntry[]>([]);

    // Theme
    const [isDarkMode, toggleTheme] = useDarkMode(true);

    const value: AppState = {
        // User info
        userId,
        username,
        experienceId,
        isCoachMode,

        // Profile
        userProfile,
        setUserProfile,

        // Data
        feedItems,
        setFeedItems,
        myActivities,
        setMyActivities,

        // Theme
        isDarkMode,
        toggleTheme,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access app-wide state
 * @throws Error if used outside AppProvider
 */
export function useApp(): AppState {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

/**
 * Hook to access just user profile state
 */
export function useUserProfile() {
    const { userProfile, setUserProfile } = useApp();
    return { userProfile, setUserProfile };
}

/**
 * Hook to access just feed data
 */
export function useFeed() {
    const { feedItems, setFeedItems } = useApp();
    return { feedItems, setFeedItems };
}

/**
 * Hook to access just user's activities
 */
export function useMyActivities() {
    const { myActivities, setMyActivities } = useApp();
    return { myActivities, setMyActivities };
}

/**
 * Hook to access just theme state
 */
export function useTheme() {
    const { isDarkMode, toggleTheme } = useApp();
    return { isDarkMode, toggleTheme };
}
