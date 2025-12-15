'use client';

import { useState, useEffect, useCallback } from 'react';
import * as api from '../lib/api';
import type { LogEntry, UserProfile } from '../types';

interface UseAppDataProps {
    userId: string;
    username: string;
    experienceId: string;
    isCoachMode: boolean;
}

interface UseAppDataReturn {
    // Profile
    profile: UserProfile;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;

    // Data
    feedItems: LogEntry[];
    myActivities: LogEntry[];

    // Streak
    streak: { current: number; longest: number } | null;

    // Actions
    createCheckin: (data: {
        type: string;
        workoutType?: string;
        reflectReason?: string;
        restReason?: string;
        note: string;
        isPublicNote: boolean;
        photoFile?: File;
        isPublicPhoto: boolean;
    }) => Promise<boolean>;
    updateCheckin: (id: string, updates: { isPublicNote?: boolean; isPublicPhoto?: boolean }) => Promise<boolean>;
    deleteCheckin: (id: string) => Promise<boolean>;

    // Loading states
    isLoading: boolean;
    isSubmitting: boolean;
    error: string | null;

    // Refresh
    refreshFeed: () => Promise<void>;
    refreshMyActivities: () => Promise<void>;
}

/**
 * Main data hook that manages all app data and API interactions
 */
export function useAppData({
    userId,
    username,
    experienceId,
    isCoachMode,
}: UseAppDataProps): UseAppDataReturn {
    // User context for API calls
    const userContext = {
        whopId: userId,
        whopExperienceId: experienceId,
    };

    // State
    const [profile, setProfile] = useState<UserProfile>({
        name: username,
        bio: '',
        avatar: '',
    });
    const [feedItems, setFeedItems] = useState<LogEntry[]>([]);
    const [myActivities, setMyActivities] = useState<LogEntry[]>([]);
    const [streak, setStreak] = useState<{ current: number; longest: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch profile on mount
    useEffect(() => {
        async function fetchProfile() {
            const result = await api.getProfile(userContext);
            if (result.data) {
                if (result.data.profile) {
                    setProfile({
                        name: result.data.profile.displayName || username,
                        bio: result.data.profile.bio || '',
                        avatar: result.data.profile.avatarUrl || '',
                    });
                }
                if (result.data.streak) {
                    setStreak({
                        current: result.data.streak.current,
                        longest: result.data.streak.longest,
                    });
                }
            }
        }
        fetchProfile();
    }, [userId, experienceId, username]);

    // Fetch feed
    const refreshFeed = useCallback(async () => {
        const result = await api.getPublicFeed(experienceId);
        if (result.data?.feed) {
            const entries = result.data.feed.map(checkin => api.checkinToLogEntry(checkin));
            setFeedItems(entries as LogEntry[]);
        }
    }, [experienceId]);

    // Fetch my activities
    const refreshMyActivities = useCallback(async () => {
        const result = await api.getMyCheckins(userContext);
        if (result.data?.checkins) {
            const entries = result.data.checkins.map(checkin =>
                api.checkinToLogEntry(checkin, profile.name)
            );
            setMyActivities(entries as LogEntry[]);
        }
    }, [userId, experienceId, profile.name]);

    // Initial data fetch
    useEffect(() => {
        async function loadInitialData() {
            setIsLoading(true);
            await Promise.all([refreshFeed(), refreshMyActivities()]);
            setIsLoading(false);
        }
        loadInitialData();
    }, [refreshFeed, refreshMyActivities]);

    // Update profile
    const handleUpdateProfile = async (updates: Partial<UserProfile> & { avatarFile?: File }) => {
        const apiUpdates: { displayName?: string; bio?: string; avatarUrl?: string } = {};
        if (updates.name !== undefined) apiUpdates.displayName = updates.name;
        if (updates.bio !== undefined) apiUpdates.bio = updates.bio;

        // Handle avatar file upload if provided
        if (updates.avatarFile) {
            const uploadResult = await api.uploadAvatar(userContext, updates.avatarFile);
            if (uploadResult.data?.path) {
                apiUpdates.avatarUrl = uploadResult.data.path;
            } else {
                setError(`Avatar upload failed: ${uploadResult.error}`);
                return;
            }
        } else if (updates.avatar !== undefined) {
            apiUpdates.avatarUrl = updates.avatar;
        }

        const result = await api.updateProfile(userContext, apiUpdates);
        if (result.data?.profile) {
            setProfile(prev => ({
                ...prev,
                name: updates.name ?? prev.name,
                bio: updates.bio ?? prev.bio,
                avatar: apiUpdates.avatarUrl ?? prev.avatar,
            }));
        }
    };

    // Create checkin
    const handleCreateCheckin = async (data: {
        type: string;
        workoutType?: string;
        reflectReason?: string;
        restReason?: string;
        note: string;
        isPublicNote: boolean;
        photoFile?: File;
        isPublicPhoto: boolean;
    }): Promise<boolean> => {
        setIsSubmitting(true);
        setError(null);

        try {
            let photoUrl: string | undefined;

            // Upload photo if provided
            if (data.photoFile) {
                const uploadResult = await api.uploadCheckinImage(
                    userContext,
                    data.photoFile,
                    api.logTypeToCheckinType(data.type)
                );

                if (uploadResult.error) {
                    setError(`Photo upload failed: ${uploadResult.error}`);
                    return false;
                }

                photoUrl = uploadResult.data?.path;
            }

            const result = await api.createCheckin(userContext, {
                type: api.logTypeToCheckinType(data.type),
                workoutType: data.workoutType ? api.workoutTypeToDbFormat(data.workoutType) : undefined,
                reflectReason: data.reflectReason as any,
                restReason: data.restReason,
                note: data.note,
                isNotePublic: data.isPublicNote,
                photoUrl: photoUrl,
                isPhotoPublic: data.isPublicPhoto,
            });

            if (result.error) {
                setError(result.error);
                return false;
            }

            // Refresh data
            await Promise.all([refreshFeed(), refreshMyActivities()]);

            // Refresh streak
            const profileResult = await api.getProfile(userContext);
            if (profileResult.data?.streak) {
                setStreak({
                    current: profileResult.data.streak.current,
                    longest: profileResult.data.streak.longest,
                });
            }

            return true;
        } finally {
            setIsSubmitting(false);
        }
    };


    // Update checkin
    const handleUpdateCheckin = async (
        id: string,
        updates: { isPublicNote?: boolean; isPublicPhoto?: boolean }
    ): Promise<boolean> => {
        const apiUpdates: { isNotePublic?: boolean; isPhotoPublic?: boolean } = {};
        if (updates.isPublicNote !== undefined) apiUpdates.isNotePublic = updates.isPublicNote;
        if (updates.isPublicPhoto !== undefined) apiUpdates.isPhotoPublic = updates.isPublicPhoto;

        const result = await api.updateCheckin(userContext, id, apiUpdates);
        if (result.error) {
            setError(result.error);
            return false;
        }
        await Promise.all([refreshFeed(), refreshMyActivities()]);
        return true;
    };

    // Delete checkin
    const handleDeleteCheckin = async (id: string): Promise<boolean> => {
        const result = await api.deleteCheckin(userContext, id, isCoachMode);
        if (result.error) {
            setError(result.error);
            return false;
        }
        await Promise.all([refreshFeed(), refreshMyActivities()]);
        return true;
    };

    return {
        profile,
        updateProfile: handleUpdateProfile,
        feedItems,
        myActivities,
        streak,
        createCheckin: handleCreateCheckin,
        updateCheckin: handleUpdateCheckin,
        deleteCheckin: handleDeleteCheckin,
        isLoading,
        isSubmitting,
        error,
        refreshFeed,
        refreshMyActivities,
    };
}
