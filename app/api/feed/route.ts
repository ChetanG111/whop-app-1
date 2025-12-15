import { NextRequest, NextResponse } from 'next/server';
import { getPublicFeed } from '@/lib/db/checkins';
import { checkRateLimit, readLimiter, getClientIp } from '@/lib/ratelimit';

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

        const feed = await getPublicFeed(experienceId, limit);

        return NextResponse.json({ feed });
    } catch (error) {
        console.error('Error in GET /api/feed:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
