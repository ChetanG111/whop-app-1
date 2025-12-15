import { NextRequest, NextResponse } from 'next/server';
import { getPublicFeed } from '@/lib/db/checkins';
import { checkRateLimit, readLimiter, getClientIp } from '@/lib/ratelimit';
import { cacheGet, cacheSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import type { CheckinWithProfile } from '@/lib/supabase/types';

// GET /api/feed - Get public feed for a community
export async function GET(request: NextRequest) {
    try {
        // Rate limit by IP (public endpoint)
        const ip = getClientIp(request);
        const rateLimitResult = await checkRateLimit(readLimiter, ip);
        if (!rateLimitResult.success) return rateLimitResult.response!;

        const { searchParams } = new URL(request.url);
        const experienceId = searchParams.get('experienceId');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!experienceId) {
            return NextResponse.json(
                { error: 'Missing experienceId' },
                { status: 400 }
            );
        }

        // Check cache first
        const cacheKey = CACHE_KEYS.feed(experienceId);
        const cachedFeed = await cacheGet<CheckinWithProfile[]>(cacheKey);

        if (cachedFeed) {
            // Return cached data (apply limit client-side for flexibility)
            return NextResponse.json({
                feed: cachedFeed.slice(0, limit),
                cached: true
            });
        }

        // Cache miss - fetch from DB
        const feed = await getPublicFeed(experienceId, limit);

        // Cache the result
        await cacheSet(cacheKey, feed, CACHE_TTL.FEED);

        return NextResponse.json({ feed, cached: false });
    } catch (error) {
        console.error('Error in GET /api/feed:', error);
        return NextResponse.json(
            { error: 'Unable to load the feed. Please refresh the page.' },
            { status: 500 }
        );
    }
}
