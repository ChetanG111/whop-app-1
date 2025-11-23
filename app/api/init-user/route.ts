/**
 * POST /api/init-user
 * 
 * Initialize or retrieve user in database
 * Called on first app access
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWhopToken } from '@/lib/whop-auth';
import { findOrCreateUser } from '@/lib/db-helpers';

// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Verify Whop token
    const { whopUserId, username } = await verifyWhopToken(req);

    // Find or create user
    const user = await findOrCreateUser(whopUserId, username as string | undefined);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        whopUserId: user.whopUserId,
        username: user.username,
        role: user.role,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        lastCheckInDate: user.lastCheckInDate,
        lastActiveDate: user.lastActiveDate,
      },
    });
  } catch (error: any) {
    console.error('POST /api/init-user error:', error);

    // Handle auth errors
    if (error.status === 401) {
      return NextResponse.json({ 
        error: {
          ...error.error,
          // Add original error for more debug context on client
          originalError: process.env.NODE_ENV === 'development' ? error : undefined,
        }
      }, { status: 401 });
    }

    // Handle other errors
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to initialize user',
        },
      },
      { status: 500 }
    );
  }
}
