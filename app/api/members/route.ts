import { NextRequest, NextResponse } from 'next/server';
import { getAllMembersByExperience } from '@/lib/db/users';

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

        const members = await getAllMembersByExperience(experienceId);

        return NextResponse.json({ members });
    } catch (error) {
        console.error('Error in GET /api/members:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
