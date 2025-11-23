/**
 * GET /api/checkin - Get today's check-in
 * POST /api/checkin - Create new check-in
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWhopToken } from '@/lib/whop-auth';
import { getTodaysCheckin, createCheckin, createPhoto } from '@/lib/db-helpers';
import { CheckInType, MuscleGroup } from '@prisma/client';

// Force Node.js runtime (required for Prisma)
export const runtime = 'nodejs';

/**
 * GET - Retrieve today's check-in for authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Verify Whop token
    const { whopUserId } = await verifyWhopToken(req);

    // Get today's check-in
    const checkin = await getTodaysCheckin(whopUserId);

    if (!checkin) {
      return NextResponse.json({
        success: true,
        checkin: null,
      });
    }

    return NextResponse.json({
      success: true,
      checkin: {
        id: checkin.id,
        type: checkin.type,
        checkInDate: checkin.checkInDate,
        muscleGroup: checkin.muscleGroup,
        note: checkin.note,
        isPublicNote: checkin.isPublicNote,
        photo: checkin.photo,
        createdAt: checkin.createdAt,
      },
    });
  } catch (error: any) {
    console.error('GET /api/checkin error:', error);

    if (error.status === 401) {
      return NextResponse.json(error.error, { status: 401 });
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve check-in',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new check-in
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[checkin POST] Starting request');
    
    // Verify Whop token
    const { whopUserId } = await verifyWhopToken(req);
    console.log('[checkin POST] User verified:', whopUserId);

    // Parse request body
    const body = await req.json();
    console.log('[checkin POST] Request body:', body);

    // Validate required fields
    if (!body.type || !Object.values(CheckInType).includes(body.type)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Valid check-in type is required (WORKOUT, REST, or REFLECTION)',
          },
        },
        { status: 400 }
      );
    }

    // Validate muscle group for workouts
    if (body.type === 'WORKOUT' && !body.muscleGroup) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Muscle group is required for workout check-ins',
          },
        },
        { status: 400 }
      );
    }

    // Validate muscle group value if provided
    if (body.muscleGroup && !Object.values(MuscleGroup).includes(body.muscleGroup)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid muscle group',
          },
        },
        { status: 400 }
      );
    }

    // Handle photo creation if URL is provided
    let photoId = body.photoId;

    if (body.photoUrl) {
      const photo = await createPhoto({
        whopUserId,
        url: body.photoUrl,
        isPublic: true, // Default to public for now, or get from body
        fileSize: body.fileSize,
        mimeType: body.mimeType,
      });
      photoId = photo.id;
    }

    // Create check-in
    const checkin = await createCheckin({
      whopUserId,
      type: body.type,
      muscleGroup: body.muscleGroup,
      note: body.note,
      isPublicNote: body.isPublicNote || false,
      photoId: photoId,
    });

    return NextResponse.json({
      success: true,
      checkin: {
        id: checkin.id,
        type: checkin.type,
        checkInDate: checkin.checkInDate,
        muscleGroup: checkin.muscleGroup,
        note: checkin.note,
        isPublicNote: checkin.isPublicNote,
        photo: checkin.photo,
        createdAt: checkin.createdAt,
      },
    });
  } catch (error: any) {
    console.error('POST /api/checkin error:', error);

    // Handle auth errors
    if (error.status === 401) {
      return NextResponse.json(error.error, { status: 401 });
    }

    // Handle duplicate check-in
    if (error.error?.code === 'DUPLICATE_CHECKIN') {
      return NextResponse.json({ error: error.error }, { status: 409 });
    }

    // Handle validation errors
    if (error.error?.code === 'VALIDATION_ERROR') {
      return NextResponse.json({ error: error.error }, { status: 400 });
    }

    // Handle other errors
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create check-in',
        },
      },
      { status: 500 }
    );
  }
}
