import { NextRequest, NextResponse } from 'next/server';
import { uploadAvatar } from '@/lib/storage';
import { getOrCreateUser } from '@/lib/db/users';

/**
 * POST /api/avatar - Upload an avatar to Supabase Storage
 * 
 * Request: multipart/form-data with:
 *   - file: The image file
 *   - whopId: User's Whop ID
 *   - whopExperienceId: Experience/community ID
 * 
 * Response: { path: string } on success
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const file = formData.get('file') as File | null;
        const whopId = formData.get('whopId') as string | null;
        const whopExperienceId = formData.get('whopExperienceId') as string | null;

        // Validate required fields
        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!whopId || !whopExperienceId) {
            return NextResponse.json(
                { error: 'Missing whopId or whopExperienceId' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'File must be an image' },
                { status: 400 }
            );
        }

        // Validate file size (max 2MB for avatars)
        const MAX_SIZE = 2 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: 'Avatar must be less than 2MB' },
                { status: 400 }
            );
        }

        // Verify user exists
        const user = await getOrCreateUser(whopId, whopExperienceId);
        if (!user) {
            return NextResponse.json(
                { error: 'Failed to verify user' },
                { status: 401 }
            );
        }

        // Convert File to Uint8Array for upload
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Upload to storage
        const path = await uploadAvatar(
            whopExperienceId,
            whopId,
            uint8Array,
            file.type
        );

        if (!path) {
            return NextResponse.json(
                { error: 'Failed to upload avatar' },
                { status: 500 }
            );
        }

        return NextResponse.json({ path }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/avatar:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
