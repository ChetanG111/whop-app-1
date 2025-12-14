import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser, getUserProfile, createUserProfile, updateUserProfile } from '@/lib/db/users';
import { getUserStreak } from '@/lib/db/streaks';

// GET /api/profile - Get user profile with streak
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const whopId = searchParams.get('whopId');
        const whopExperienceId = searchParams.get('whopExperienceId');

        if (!whopId || !whopExperienceId) {
            return NextResponse.json(
                { error: 'Missing whopId or whopExperienceId' },
                { status: 400 }
            );
        }

        // Get or create user
        const user = await getOrCreateUser(whopId, whopExperienceId);
        if (!user) {
            return NextResponse.json(
                { error: 'Failed to get or create user' },
                { status: 500 }
            );
        }

        // Get profile and streak
        const [profile, streak] = await Promise.all([
            getUserProfile(user.id),
            getUserStreak(user.id),
        ]);

        return NextResponse.json({
            user: {
                id: user.id,
                whopId: user.whopId,
                role: user.role,
                isNew: user.isNew,
            },
            profile: profile ? {
                displayName: profile.display_name,
                bio: profile.bio,
                avatarUrl: profile.avatar_url,
                themePreference: profile.theme_preference,
            } : null,
            streak: streak ? {
                current: streak.current_streak,
                longest: streak.longest_streak,
                lastCheckinDate: streak.last_checkin_date,
            } : null,
        });
    } catch (error) {
        console.error('Error in GET /api/profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH /api/profile - Update user profile
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { whopId, whopExperienceId, displayName, bio, avatarUrl, themePreference } = body;

        if (!whopId || !whopExperienceId) {
            return NextResponse.json(
                { error: 'Missing whopId or whopExperienceId' },
                { status: 400 }
            );
        }

        // Get user
        const user = await getOrCreateUser(whopId, whopExperienceId);
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Check if profile exists
        let profile = await getUserProfile(user.id);

        if (!profile) {
            // Create profile if it doesn't exist
            profile = await createUserProfile(user.id, displayName || 'User');
            if (!profile) {
                return NextResponse.json(
                    { error: 'Failed to create profile' },
                    { status: 500 }
                );
            }
        }

        // Build updates
        const updates: {
            display_name?: string | null;
            bio?: string | null;
            avatar_url?: string | null;
            theme_preference?: 'light' | 'dark' | 'system';
        } = {};

        if (displayName !== undefined) updates.display_name = displayName;
        if (bio !== undefined) updates.bio = bio;
        if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
        if (themePreference !== undefined) updates.theme_preference = themePreference;

        // Update profile
        profile = await updateUserProfile(user.id, updates);

        if (!profile) {
            return NextResponse.json(
                { error: 'Failed to update profile' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            profile: {
                displayName: profile.display_name,
                bio: profile.bio,
                avatarUrl: profile.avatar_url,
                themePreference: profile.theme_preference,
            },
        });
    } catch (error) {
        console.error('Error in PATCH /api/profile:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
