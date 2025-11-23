/**
 * DELETE /api/clear-data
 * 
 * Development only - clears user's data
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWhopToken } from '@/lib/whop-auth';
import { prisma } from '@/lib/prisma';

// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs';

export async function DELETE(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'This endpoint is only available in development' } },
      { status: 403 }
    );
  }

  try {
    const { whopUserId } = await verifyWhopToken(req);

    // Delete user's check-ins
    await prisma.checkIn.deleteMany({
      where: { whopUserId },
    });

    // Delete user's photos
    await prisma.photo.deleteMany({
      where: { whopUserId },
    });

    // Reset user's streak
    await prisma.user.update({
      where: { whopUserId },
      data: {
        currentStreak: 0,
        longestStreak: 0,
        lastCheckInDate: null,
        lastPhotoDate: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/clear-data error:', error);

    if (error.status === 401) {
      return NextResponse.json({ error: error.error }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to clear data',
        },
      },
      { status: 500 }
    );
  }
}
