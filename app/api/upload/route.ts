import { NextRequest, NextResponse } from 'next/server';
import { uploadCheckinPhoto } from '@/lib/storage';
import { getOrCreateUser } from '@/lib/db/users';
import { checkRateLimit, uploadLimiter, getClientIp } from '@/lib/ratelimit';

/**
 * POST /api/upload - Upload a checkin photo to Supabase Storage
 * 
 * Request: multipart/form-data with:
 *   - file: The image file
 *   - whopId: User's Whop ID
 *   - whopExperienceId: Experience/community ID
 *   - checkinType: workout/rest/reflect
 * 
 * Response: { path: string } on success
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const whopId = formData.get('whopId') as string | null;

        // Rate limit by user ID if available, otherwise by IP
        const rateLimitId = whopId || getClientIp(request);
        const rateLimitResult = await checkRateLimit(uploadLimiter, rateLimitId);
        if (!rateLimitResult.success) return rateLimitResult.response!;

        const file = formData.get('file') as File | null;
        const whopExperienceId = formData.get('whopExperienceId') as string | null;
        const checkinType = formData.get('checkinType') as string | null;

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

        if (!checkinType || !['workout', 'rest', 'reflect'].includes(checkinType)) {
            return NextResponse.json(
                { error: 'Invalid checkinType' },
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

        // Validate file size (max 5MB)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: 'File size must be less than 5MB' },
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
        const path = await uploadCheckinPhoto(
            whopExperienceId,
            whopId,
            uint8Array,
            checkinType,
            file.type
        );

        if (!path) {
            return NextResponse.json(
                { error: 'Failed to upload file' },
                { status: 500 }
            );
        }

        return NextResponse.json({ path }, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/upload:', error);
        return NextResponse.json(
            { error: 'Unable to upload your photo. Please try again.' },
            { status: 500 }
        );
    }
}
