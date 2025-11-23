/**
 * GET /api/coach/dashboard
 * 
 * Get coach dashboard data
 * Requires COACH role
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWhopToken } from '@/lib/whop-auth';
import { getCoachDashboard, findOrCreateUser } from '@/lib/db-helpers';

// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Verify Whop token
    const { whopUserId } = await verifyWhopToken(req);

    // Get user and verify COACH role
    const user = await findOrCreateUser(whopUserId);

    if (user.role !== 'COACH') {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Coach access required',
          },
        },
        { status: 403 }
      );
    }

    // Get dashboard data
    const dashboard = await getCoachDashboard();

    return NextResponse.json(
      {
        success: true,
        dashboard: {
          members: dashboard.members.map((m) => ({
            whopUserId: m.whopUserId,
            username: m.username,
            currentStreak: m.currentStreak,
            longestStreak: m.longestStreak,
            lastCheckInDate: m.lastCheckInDate,
            status: m.status, // 'active', 'slipping', 'ghosting'
            photoCount: m.photoCount,
          })),
          stats: dashboard.stats,
        },
      },
      {
        headers: {
          'Cache-Control': 'private, s-maxage=120, stale-while-revalidate=240',
        },
      }
    );
  } catch (error: any) {
    console.error('GET /api/coach/dashboard error:', error);

    if (error.status === 401) {
      return NextResponse.json(error.error, { status: 401 });
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve coach dashboard',
        },
      },
      { status: 500 }
    );
  }
}
