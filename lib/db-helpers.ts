/**
 * Database Helper Functions
 * 
 * Core business logic for the fitness accountability app.
 * All database operations go through these helpers to ensure consistency.
 */

import { prisma } from './prisma';
import { UserRole, CheckInType, MuscleGroup } from '@prisma/client';
import {
  calculateNewStreak,
  maintainsStreak,
  getTodayUTC,
  getStreakStatus,
  isPhotoCompliant,
} from './streak-rules';

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AppError {
  error: {
    code: string;
    message: string;
  };
}

export function createError(code: string, message: string): AppError {
  return { error: { code, message } };
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Find or create a user by Whop user ID
 * Called on first app access to initialize user in database
 */
export async function findOrCreateUser(
  whopUserId: string,
  username?: string,
  role: UserRole = 'MEMBER'
) {
  try {
    const user = await prisma.user.upsert({
      where: { whopUserId },
      update: {
        username: username || null,
      },
      create: {
        whopUserId,
        username: username || null,
        role,
      },
    });

    return user;
  } catch (error) {
    console.error('findOrCreateUser error:', error);
    throw error;
  }
}

/**
 * Update user's last active timestamp
 */
export async function updateUserActivity(whopUserId: string) {
  try {
    await prisma.user.update({
      where: { whopUserId },
      data: {
        lastActiveDate: new Date(),
      },
    });
  } catch (error) {
    console.error('updateUserActivity error:', error);
    throw error;
  }
}

// ============================================================================
// CHECK-IN OPERATIONS
// ============================================================================

/**
 * Get today's check-in for a user (if exists)
 * Uses UTC calendar date for consistency
 */
export async function getTodaysCheckin(whopUserId: string) {
  try {
    const today = getTodayUTC();

    const checkin = await prisma.checkIn.findFirst({
      where: {
        whopUserId,
        checkInDate: today,
      },
      include: {
        photo: true,
      },
    });

    return checkin;
  } catch (error) {
    console.error('getTodaysCheckin error:', error);
    throw error;
  }
}

/**
 * Create a new check-in
 * 
 * Validation:
 * - One check-in per day (enforced by DB constraint)
 * - Muscle group required for WORKOUT type
 * - Updates user streak automatically
 */
export async function createCheckin(data: {
  whopUserId: string;
  type: CheckInType;
  muscleGroup?: MuscleGroup;
  note?: string;
  isPublicNote?: boolean;
  photoId?: string;
}) {
  try {
    // Validation: muscle group required for WORKOUT
    if (data.type === 'WORKOUT' && !data.muscleGroup) {
      throw createError('VALIDATION_ERROR', 'Muscle group is required for workout check-ins');
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { whopUserId: data.whopUserId },
    });

    if (!user) {
      throw createError('USER_NOT_FOUND', 'User not found');
    }

    const today = getTodayUTC();

    // Create check-in
    const checkin = await prisma.checkIn.create({
      data: {
        userId: user.id,
        whopUserId: data.whopUserId,
        type: data.type,
        checkInDate: today,
        muscleGroup: data.muscleGroup || null,
        note: data.note || null,
        isPublicNote: data.isPublicNote || false,
        photoId: data.photoId || null,
      },
      include: {
        photo: true,
      },
    });

    // Update streak
    await updateStreakOnCheckin(data.whopUserId, data.type);

    // Update community stats
    await updateCommunityStats(today);

    return checkin;
  } catch (error: any) {
    // Handle unique constraint violation (duplicate check-in)
    if (error.code === 'P2002') {
      throw createError('DUPLICATE_CHECKIN', 'You have already checked in today');
    }

    console.error('createCheckin error:', error);
    throw error;
  }
}

/**
 * Update user's streak based on check-in type
 * 
 * Rules (from streak-rules.ts):
 * - WORKOUT: Maintains/increments streak
 * - REST: Maintains/increments streak
 * - REFLECTION: Breaks streak
 */
export async function updateStreakOnCheckin(whopUserId: string, checkinType: CheckInType) {
  try {
    const user = await prisma.user.findUnique({
      where: { whopUserId },
    });

    if (!user) {
      throw createError('USER_NOT_FOUND', 'User not found');
    }

    const today = getTodayUTC();

    // Check if this check-in type maintains the streak
    if (maintainsStreak(checkinType)) {
      // Calculate new streak
      const newStreak = calculateNewStreak(
        user.lastCheckInDate,
        today,
        user.currentStreak
      );

      // Update user
      await prisma.user.update({
        where: { whopUserId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(newStreak, user.longestStreak),
          lastCheckInDate: today,
        },
      });
    } else {
      // Reflection breaks the streak
      await prisma.user.update({
        where: { whopUserId },
        data: {
          currentStreak: 0,
          lastCheckInDate: today,
        },
      });
    }
  } catch (error) {
    console.error('updateStreakOnCheckin error:', error);
    throw error;
  }
}

/**
 * Get user's check-in history
 * Used for heatmap and personal activity view
 */
export async function getCheckinHistory(whopUserId: string, limit = 365) {
  try {
    const checkins = await prisma.checkIn.findMany({
      where: { whopUserId },
      orderBy: { checkInDate: 'desc' },
      take: limit,
      include: {
        photo: {
          select: {
            url: true,
            isPublic: true,
          },
        },
      },
    });

    return checkins;
  } catch (error) {
    console.error('getCheckinHistory error:', error);
    throw error;
  }
}

// ============================================================================
// PHOTO MANAGEMENT
// ============================================================================

/**
 * Create photo record
 * 
 * LIMITS: Validate file size & type server-side before calling this
 * - Max 10MB
 * - jpg/png only
 */
export async function createPhoto(data: {
  whopUserId: string;
  url: string;
  isPublic?: boolean;
  fileSize?: number;
  mimeType?: string;
}) {
  try {
    // Validation: file size (10MB max)
    if (data.fileSize && data.fileSize > 10 * 1024 * 1024) {
      throw createError('FILE_TOO_LARGE', 'File size must be less than 10MB');
    }

    // Validation: mime type (jpg/png only)
    if (data.mimeType && !['image/jpeg', 'image/png'].includes(data.mimeType)) {
      throw createError('INVALID_FILE_TYPE', 'Only JPEG and PNG images are allowed');
    }

    const user = await prisma.user.findUnique({
      where: { whopUserId: data.whopUserId },
    });

    if (!user) {
      throw createError('USER_NOT_FOUND', 'User not found');
    }

    const photo = await prisma.photo.create({
      data: {
        userId: user.id,
        whopUserId: data.whopUserId,
        url: data.url,
        isPublic: data.isPublic || false,
        fileSize: data.fileSize || null,
        mimeType: data.mimeType || null,
      },
    });

    // Update user's last photo date
    await prisma.user.update({
      where: { whopUserId: data.whopUserId },
      data: {
        lastPhotoDate: new Date(),
      },
    });

    return photo;
  } catch (error) {
    console.error('createPhoto error:', error);
    throw error;
  }
}

/**
 * Check if user has met photo compliance (2 photos per week)
 */
export async function validatePhotoCompliance(whopUserId: string): Promise<boolean> {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const photoCount = await prisma.photo.count({
      where: {
        whopUserId,
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    return isPhotoCompliant(photoCount);
  } catch (error) {
    console.error('validatePhotoCompliance error:', error);
    throw error;
  }
}

// ============================================================================
// FEED & STATS
// ============================================================================

/**
 * Get public feed
 * 
 * PRIVACY: Only returns check-ins with public photos or public notes
 * Never exposes private photo URLs
 */
export async function getPublicFeed(limit = 20, offset = 0) {
  try {
    const checkins = await prisma.checkIn.findMany({
      where: {
        OR: [
          { isPublicNote: true },
          {
            photo: {
              isPublic: true,
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            whopUserId: true,
            username: true,
          },
        },
        photo: {
          select: {
            url: true,
            isPublic: true,
          },
        },
      },
    });

    // Filter out private photo URLs
    const sanitizedCheckins = checkins.map((checkin) => ({
      ...checkin,
      photo: checkin.photo?.isPublic ? checkin.photo : null,
    }));

    return sanitizedCheckins;
  } catch (error) {
    console.error('getPublicFeed error:', error);
    throw error;
  }
}

/**
 * Get community statistics for a specific date
 */
export async function getCommunityStats(date?: Date) {
  try {
    const targetDate = date || getTodayUTC();

    const stats = await prisma.communityStats.findUnique({
      where: { date: targetDate },
    });

    return stats;
  } catch (error) {
    console.error('getCommunityStats error:', error);
    throw error;
  }
}

/**
 * Update community statistics for a specific date
 * Called after each check-in to keep stats current
 */
export async function updateCommunityStats(date: Date) {
  try {
    // Count total members
    const totalMembers = await prisma.user.count({
      where: { role: 'MEMBER' },
    });

    // Count check-ins for this date
    const [workoutCount, restCount, reflectionCount] = await Promise.all([
      prisma.checkIn.count({
        where: { checkInDate: date, type: 'WORKOUT' },
      }),
      prisma.checkIn.count({
        where: { checkInDate: date, type: 'REST' },
      }),
      prisma.checkIn.count({
        where: { checkInDate: date, type: 'REFLECTION' },
      }),
    ]);

    const activeToday = workoutCount + restCount + reflectionCount;

    // Upsert stats
    await prisma.communityStats.upsert({
      where: { date },
      update: {
        totalMembers,
        activeToday,
        workoutCheckIns: workoutCount,
        restCheckIns: restCount,
        reflectionCheckIns: reflectionCount,
      },
      create: {
        date,
        totalMembers,
        activeToday,
        workoutCheckIns: workoutCount,
        restCheckIns: restCount,
        reflectionCheckIns: reflectionCount,
      },
    });
  } catch (error) {
    console.error('updateCommunityStats error:', error);
    throw error;
  }
}

// ============================================================================
// COACH DASHBOARD
// ============================================================================

/**
 * Get coach dashboard data
 * 
 * Returns:
 * - Member list with streak status (🟢 active, 🟡 slipping, 🔴 ghosting)
 * - Weekly engagement percentages
 * - Photo compliance tracking
 * - Reflection vs ghost counts
 */
export async function getCoachDashboard() {
  try {
    // Get all members with photo count
    const members = await prisma.user.findMany({
      where: { role: 'MEMBER' },
      select: {
        whopUserId: true,
        username: true,
        currentStreak: true,
        longestStreak: true,
        lastCheckInDate: true,
        lastPhotoDate: true,
        _count: {
          select: { photos: true },
        },
      },
    });

    // Calculate streak status for each member
    const membersWithStatus = members.map((member) => ({
      whopUserId: member.whopUserId,
      username: member.username,
      currentStreak: member.currentStreak,
      longestStreak: member.longestStreak,
      lastCheckInDate: member.lastCheckInDate,
      photoCount: member._count.photos,
      lastPhotoDate: member.lastPhotoDate,
      status: getStreakStatus(member.lastCheckInDate),
    }));

    // Get weekly stats
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyCheckins = await prisma.checkIn.count({
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    const weeklyReflections = await prisma.checkIn.count({
      where: {
        type: 'REFLECTION',
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    const totalMembers = members.length;
    const engagementRate = totalMembers > 0 ? (weeklyCheckins / (totalMembers * 7)) * 100 : 0;

    // Photo compliance
    const photoCompliantCount = await Promise.all(
      members.map((m) => validatePhotoCompliance(m.whopUserId))
    ).then((results) => results.filter(Boolean).length);

    return {
      members: membersWithStatus,
      stats: {
        totalMembers,
        weeklyCheckins,
        weeklyReflections,
        engagementRate: Math.round(engagementRate * 10) / 10, // Round to 1 decimal
        photoCompliantCount,
        photoComplianceRate:
          totalMembers > 0 ? Math.round((photoCompliantCount / totalMembers) * 100) : 0,
      },
    };
  } catch (error) {
    console.error('getCoachDashboard error:', error);
    throw error;
  }
}
