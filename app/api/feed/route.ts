/**
 * GET /api/feed
 * 
 * Get public feed of check-ins
 * PRIVACY: Only returns public photos and notes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPublicFeed } from '@/lib/db-helpers';

// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Get query params
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Validate params
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Limit must be between 1 and 100',
          },
        },
        { status: 400 }
      );
    }

    // Get public feed
    const checkins = await getPublicFeed(limit, offset);

    return NextResponse.json(
      {
        success: true,
        checkins: checkins.map((c) => ({
          id: c.id,
          type: c.type,
          checkInDate: c.checkInDate,
          muscleGroup: c.muscleGroup,
          note: c.isPublicNote ? c.note : null,
          photo: c.photo, // Already filtered by privacy in db-helpers
          createdAt: c.createdAt,
          user: {
            whopUserId: c.user.whopUserId,
            username: c.user.username,
          },
        })),
        pagination: {
          limit,
          offset,
          hasMore: checkins.length === limit,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error('GET /api/feed error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve feed',
        },
      },
      { status: 500 }
    );
  }
}
