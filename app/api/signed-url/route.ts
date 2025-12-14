import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrl, getAvatarSignedUrl } from '@/lib/storage';

/**
 * GET /api/signed-url - Generate a signed URL for viewing a private photo
 * 
 * Query params:
 *   - path: The storage path (from photo_url or avatar_url column)
 *   - bucket: 'checkin-photos' (default) or 'avatars'
 * 
 * Response: { url: string } on success
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');
        const bucket = searchParams.get('bucket') || 'checkin-photos';

        if (!path) {
            return NextResponse.json(
                { error: 'Missing path parameter' },
                { status: 400 }
            );
        }

        let url: string | null;

        if (bucket === 'avatars') {
            url = await getAvatarSignedUrl(path);
        } else {
            url = await getSignedUrl(path);
        }

        if (!url) {
            return NextResponse.json(
                { error: 'Failed to generate signed URL' },
                { status: 500 }
            );
        }

        return NextResponse.json({ url });
    } catch (error) {
        console.error('Error in GET /api/signed-url:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
