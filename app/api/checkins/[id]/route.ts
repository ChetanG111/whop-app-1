import { NextRequest, NextResponse } from 'next/server';
import { updateCheckin, deleteCheckin } from '@/lib/db/checkins';
import { getOrCreateUser } from '@/lib/db/users';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PATCH /api/checkins/[id] - Update a check-in
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { whopId, whopExperienceId, isNotePublic, isPhotoPublic, note } = body;

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

        // Build updates object
        const updates: { note?: string; is_note_public?: boolean; is_photo_public?: boolean } = {};
        if (typeof isNotePublic === 'boolean') updates.is_note_public = isNotePublic;
        if (typeof isPhotoPublic === 'boolean') updates.is_photo_public = isPhotoPublic;
        if (typeof note === 'string') updates.note = note;

        const checkin = await updateCheckin(id, user.id, updates);

        if (!checkin) {
            return NextResponse.json(
                { error: 'Check-in not found or not authorized' },
                { status: 404 }
            );
        }

        return NextResponse.json({ checkin });
    } catch (error) {
        console.error('Error in PATCH /api/checkins/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/checkins/[id] - Delete a check-in
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const whopId = searchParams.get('whopId');
        const whopExperienceId = searchParams.get('whopExperienceId');

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

        const isAdmin = user.role === 'admin';
        const deleted = await deleteCheckin(id, user.id, isAdmin);

        if (!deleted) {
            return NextResponse.json(
                { error: 'Check-in not found or not authorized' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/checkins/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
