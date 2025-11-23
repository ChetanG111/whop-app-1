/**
 * GET /api/checkin/history
 * 
 * Get user's check-in history for heatmap and personal view
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWhopToken } from '@/lib/whop-auth';
import { getCheckinHistory } from '@/lib/db-helpers';

// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    // Verify Whop token
    const { whopUserId } = await verifyWhopToken(req);

    // Get query params
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '365');

    // Get check-in history
    const checkins = await getCheckinHistory(whopUserId, limit);

    // Transform for heatmap format
    const heatmapData = checkins.map((checkin) => ({
      date: checkin.checkInDate.toISOString().split('T')[0],
      type: checkin.type,
      value:
        checkin.type === 'WORKOUT'
          ? 1
          : checkin.type === 'REST'
          ? 2
          : 0,
    }));

    return NextResponse.json({
      success: true,
      checkins: checkins.map((c) => ({
        id: c.id,
        type: c.type,
        checkInDate: c.checkInDate,
        muscleGroup: c.muscleGroup,
        note: c.note,
        isPublicNote: c.isPublicNote,
        photo: c.photo?.isPublic ? c.photo : null,
        createdAt: c.createdAt,
      })),
      heatmapData,
    });
  } catch (error: any) {
    console.error('GET /api/checkin/history error:', error);
    if (error.status === 401) {
      return NextResponse.json(error.error, { status: 401 });
    }
    return NextResponse.json(
      {
        error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve check-in history' },
      },
      { status: 500 }
    );
  }
}
