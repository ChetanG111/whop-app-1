import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrl, getAvatarSignedUrl } from '@/lib/storage';
import { checkRateLimit, signedUrlLimiter, getClientIp } from '@/lib/ratelimit';
import { cacheGet, cacheSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

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
        // Rate limit by IP
        const ip = getClientIp(request);
        const rateLimitResult = await checkRateLimit(signedUrlLimiter, ip);
        if (!rateLimitResult.success) return rateLimitResult.response!;

        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');
        const bucket = searchParams.get('bucket') || 'checkin-photos';

        if (!path) {
            return NextResponse.json(
                { error: 'Missing path parameter' },
                { status: 400 }
            );
        }

        // Check cache first
        const cacheKey = CACHE_KEYS.signedUrl(bucket, path);
        const cachedUrl = await cacheGet<string>(cacheKey);

        if (cachedUrl) {
            return NextResponse.json({ url: cachedUrl, cached: true });
        }

        // Cache miss - generate new signed URL
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

        // Cache the signed URL (30 min, Supabase URLs expire in 1 hour)
        await cacheSet(cacheKey, url, CACHE_TTL.SIGNED_URL);

        return NextResponse.json({ url, cached: false });
    } catch (error) {
        console.error('Error in GET /api/signed-url:', error);
        return NextResponse.json(
            { error: 'Unable to load image. Please refresh the page.' },
            { status: 500 }
        );
    }
}
