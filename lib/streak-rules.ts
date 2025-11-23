/**
 * Centralized Streak Logic & Business Rules
 * 
 * This file defines all streak-related business logic in one place
 * to ensure consistency across the application.
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * What constitutes a "day" for streak purposes
 * - Using UTC calendar day (not 24h rolling window)
 * - This ensures consistent behavior across timezones
 */
export const STREAK_DAY_TYPE = 'UTC_CALENDAR_DAY' as const;

/**
 * Maximum days between check-ins before streak resets
 */
export const MAX_DAYS_BETWEEN_CHECKINS = 1;

/**
 * Photo compliance requirement (photos per week)
 */
export const PHOTOS_PER_WEEK_REQUIRED = 2;

// ============================================================================
// TYPES
// ============================================================================

export type StreakStatus = 'active' | 'slipping' | 'ghosting';

export interface StreakCalculation {
  currentStreak: number;
  longestStreak: number;
  status: StreakStatus;
}

// ============================================================================
// CORE LOGIC
// ============================================================================

/**
 * Check if a check-in maintains the streak
 * 
 * Rules:
 * - WORKOUT: Maintains streak
 * - REST: Maintains streak
 * - REFLECTION: Does NOT maintain streak (breaks it)
 * 
 * @example
 * maintainsStreak('WORKOUT') // true
 * maintainsStreak('REST') // true
 * maintainsStreak('REFLECTION') // false
 */
export function maintainsStreak(checkinType: 'WORKOUT' | 'REST' | 'REFLECTION'): boolean {
  return checkinType === 'WORKOUT' || checkinType === 'REST';
}

/**
 * Calculate days between two dates (UTC calendar days)
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of calendar days between dates
 * 
 * @example
 * daysBetween(new Date('2025-11-22'), new Date('2025-11-23')) // 1
 * daysBetween(new Date('2025-11-22'), new Date('2025-11-24')) // 2
 */
export function daysBetween(date1: Date, date2: Date): number {
  const utc1 = Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate());
  const utc2 = Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.abs(Math.floor((utc2 - utc1) / msPerDay));
}

/**
 * Get today's date as UTC calendar date (time set to 00:00:00)
 * 
 * @returns Today's date in UTC
 */
export function getTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Calculate new streak based on last check-in date and current check-in
 * 
 * Rules:
 * - If no previous check-in: streak = 1
 * - If checking in same day: no change to streak
 * - If consecutive days (1 day gap): increment streak
 * - If more than 1 day gap: reset streak to 1
 * 
 * @param lastCheckinDate - Date of last check-in (or null if first check-in)
 * @param currentCheckinDate - Date of current check-in
 * @param currentStreak - Current streak count
 * @returns New streak count
 * 
 * @example
 * calculateNewStreak(null, new Date(), 0) // 1 (first check-in)
 * calculateNewStreak(new Date('2025-11-22'), new Date('2025-11-23'), 5) // 6 (consecutive)
 * calculateNewStreak(new Date('2025-11-20'), new Date('2025-11-23'), 5) // 1 (gap too large)
 */
export function calculateNewStreak(
  lastCheckinDate: Date | null,
  currentCheckinDate: Date,
  currentStreak: number
): number {
  // First check-in ever
  if (!lastCheckinDate) {
    return 1;
  }

  const daysDiff = daysBetween(lastCheckinDate, currentCheckinDate);

  // Same day check-in (shouldn't happen due to DB constraint, but handle it)
  if (daysDiff === 0) {
    return currentStreak;
  }

  // Consecutive days (1 day apart)
  if (daysDiff === 1) {
    return currentStreak + 1;
  }

  // Gap too large - reset streak
  return 1;
}

/**
 * Determine user's streak status for coach dashboard
 * 
 * Status definitions:
 * - 'active' (🟢): Checked in within last 24 hours
 * - 'slipping' (🟡): Last check-in was 1-2 days ago
 * - 'ghosting' (🔴): Last check-in was 3+ days ago (or never)
 * 
 * @param lastCheckinDate - Date of user's last check-in
 * @returns Streak status
 */
export function getStreakStatus(lastCheckinDate: Date | null): StreakStatus {
  if (!lastCheckinDate) {
    return 'ghosting';
  }

  const today = getTodayUTC();
  const daysSinceLastCheckin = daysBetween(lastCheckinDate, today);

  if (daysSinceLastCheckin === 0) {
    return 'active';
  }

  if (daysSinceLastCheckin <= 2) {
    return 'slipping';
  }

  return 'ghosting';
}

/**
 * Check if user has met photo compliance (2 photos per week)
 * 
 * @param photoCount - Number of photos uploaded this week
 * @returns true if compliant, false otherwise
 */
export function isPhotoCompliant(photoCount: number): boolean {
  return photoCount >= PHOTOS_PER_WEEK_REQUIRED;
}

// ============================================================================
// EDGE CASES & NOTES
// ============================================================================

/**
 * EDGE CASES HANDLED:
 * 
 * 1. Timezone consistency: All dates stored as UTC DATE (not timestamp)
 *    - Frontend converts to user's timezone for display
 *    - Backend always works with UTC calendar days
 * 
 * 2. Same-day duplicate check-ins: Prevented by DB unique constraint
 *    - Prisma schema: @@unique([whopUserId, checkDate])
 * 
 * 3. Reflection check-ins: Break the streak but are tracked separately
 *    - Helps coaches identify honest engagement vs ghosting
 * 
 * 4. Streak reset: Happens when gap > 1 day
 *    - Example: Check-in on Mon, skip Tue, check-in on Wed = reset
 * 
 * 5. First check-in: Always starts streak at 1
 * 
 * 6. Longest streak: Tracked separately, never decreases
 */
