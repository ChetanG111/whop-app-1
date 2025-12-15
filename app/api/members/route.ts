import { NextRequest, NextResponse } from 'next/server';
import { getAllMembersByExperience, MemberData } from '@/lib/db/users';
import { checkRateLimit, readLimiter, getClientIp } from '@/lib/ratelimit';
import { cacheGet, cacheSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// GET /api/members - Get all members for an experience
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const experienceId = searchParams.get('experienceId');

        if (!experienceId) {
            return NextResponse.json(
                { error: 'Missing experienceId' },
                { status: 400 }
            );
        }

        // Rate limit by experience ID (coach-only endpoint typically)
        const rateLimitResult = await checkRateLimit(readLimiter, experienceId);
        if (!rateLimitResult.success) return rateLimitResult.response!;

        // Check cache first
        const cacheKey = CACHE_KEYS.members(experienceId);
        const cachedMembers = await cacheGet<MemberData[]>(cacheKey);

        if (cachedMembers) {
            return NextResponse.json({ members: cachedMembers, cached: true });
        }

        // Cache miss - fetch from DB
        const members = await getAllMembersByExperience(experienceId);

        // Cache the result
        await cacheSet(cacheKey, members, CACHE_TTL.MEMBERS);

        return NextResponse.json({ members, cached: false });
    } catch (error) {
        console.error('Error in GET /api/members:', error);
        return NextResponse.json(
            { error: 'Unable to load members. Please refresh the page.' },
            { status: 500 }
        );
    }
}
