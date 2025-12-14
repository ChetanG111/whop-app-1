import { NextRequest, NextResponse } from 'next/server';
import { createCheckin, getTodayCheckin, getUserCheckins } from '@/lib/db/checkins';
import { getOrCreateUser } from '@/lib/db/users';
import type { CheckinType, WorkoutType, ReflectReason } from '@/lib/supabase';

// POST /api/checkins - Create a new check-in
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            whopId,
            whopExperienceId,
            type,
            workoutType,
            reflectReason,
            restReason,
            note,
            isNotePublic,
            photoUrl,
            isPhotoPublic
        } = body;

        if (!whopId || !whopExperienceId) {
            return NextResponse.json(
                { error: 'Missing whopId or whopExperienceId' },
                { status: 400 }
            );
        }

        if (!type || !['workout', 'rest', 'reflect'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid check-in type' },
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

        // Check if already checked in today
        const existingCheckin = await getTodayCheckin(user.id);
        if (existingCheckin) {
            return NextResponse.json(
                { error: 'You already checked in today! Come back tomorrow 💪', checkin: existingCheckin },
                { status: 409 }
            );
        }

        // Create check-in
        const checkin = await createCheckin(user.id, {
            type: type as CheckinType,
            workoutType: workoutType as WorkoutType,
            reflectReason: reflectReason as ReflectReason,
            restReason,
            note,
            isNotePublic,
            photoUrl,
            isPhotoPublic,
        });

        if (!checkin) {
            return NextResponse.json(
                { error: 'Failed to create check-in' },
                { status: 500 }
            );
        }

        return NextResponse.json({ checkin }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/checkins:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET /api/checkins - Get user's check-in history
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const whopId = searchParams.get('whopId');
        const whopExperienceId = searchParams.get('whopExperienceId');
        const limit = parseInt(searchParams.get('limit') || '50');

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

        // Get check-ins
        const checkins = await getUserCheckins(user.id, limit);

        return NextResponse.json({ checkins });
    } catch (error) {
        console.error('Error in GET /api/checkins:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
