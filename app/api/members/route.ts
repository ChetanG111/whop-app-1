import { NextRequest, NextResponse } from 'next/server';
import { getAllMembersByExperience, MemberData } from '@/lib/db/users';
import { checkRateLimit, readLimiter, getClientIp } from '@/lib/ratelimit';
import { cacheGet, cacheSet, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

// GET /api/members - Get all members for an experience
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const experienceId = searchParams.get('experienceId');
        const companyId = searchParams.get('companyId');

        if (!experienceId && !companyId) {
            return NextResponse.json(
                { error: 'Missing experienceId or companyId' },
                { status: 400 }
            );
        }

        // Rate limit by ID (coach-only endpoint typically)
        const rateLimitResult = await checkRateLimit(readLimiter, experienceId || companyId!);
        if (!rateLimitResult.success) return rateLimitResult.response!;

        // Check cache first
        const cacheKey = experienceId
            ? CACHE_KEYS.members(experienceId)
            : CACHE_KEYS.companyMembers(companyId!);

        const cachedMembers = await cacheGet<MemberData[]>(cacheKey);

        if (cachedMembers) {
            return NextResponse.json({ members: cachedMembers, cached: true });
        }

        // Cache miss - fetch from DB
        let members: MemberData[] = [];

        if (experienceId) {
            members = await getAllMembersByExperience(experienceId);
        } else if (companyId) {
            const { getAllMembersByWhop } = await import('@/lib/db/users');
            members = await getAllMembersByWhop(companyId);
        }

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
