import { NextRequest, NextResponse } from 'next/server';
import { getAllMembersByExperience } from '@/lib/db/users';
import { checkRateLimit, readLimiter, getClientIp } from '@/lib/ratelimit';

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

        const members = await getAllMembersByExperience(experienceId);

        return NextResponse.json({ members });
    } catch (error) {
        console.error('Error in GET /api/members:', error);
        return NextResponse.json(
            { error: 'Unable to load members. Please refresh the page.' },
            { status: 500 }
        );
    }
}
