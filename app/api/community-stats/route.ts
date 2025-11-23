/**
 * GET /api/community-stats
 * 
 * Get community statistics for a specific date
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCommunityStats } from '@/lib/db-helpers';
import { getTodayUTC } from '@/lib/streak-rules';

// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Get query params
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');

    // Parse date or use today
    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid date format. Use YYYY-MM-DD',
            },
          },
          { status: 400 }
        );
      }
    } else {
      targetDate = getTodayUTC();
    }

    // Get stats
    const stats = await getCommunityStats(targetDate);

    if (!stats) {
      return NextResponse.json({
        success: true,
        stats: {
          date: targetDate,
          totalMembers: 0,
          activeToday: 0,
          workoutCount: 0,
          restCount: 0,
          reflectionCount: 0,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        stats: {
          date: stats.date,
          totalMembers: stats.totalMembers,
          activeToday: stats.activeToday,
          workoutCount: stats.workoutCheckIns,
          restCount: stats.restCheckIns,
          reflectionCount: stats.reflectionCheckIns,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    console.error('GET /api/community-stats error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve community stats',
        },
      },
      { status: 500 }
    );
  }
}
