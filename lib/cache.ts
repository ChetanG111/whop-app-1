/**
 * Redis Cache Utility Module
 * 
 * Provides caching helpers for read-heavy endpoints using Upstash Redis.
 * Uses a fail-open strategy - if Redis is unavailable, requests fall through to DB.
 */

import { Redis } from '@upstash/redis';

// Initialize Redis client (reuse same connection as rate limiter)
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ============================================
// Cache Key Generators
// ============================================

export const CACHE_KEYS = {
    /** Public feed for an experience */
    feed: (experienceId: string) => `cache:feed:${experienceId}`,

    /** Members list for an experience (coach view) */
    members: (experienceId: string) => `cache:members:${experienceId}`,

    /** Signed URL for a storage path */
    signedUrl: (bucket: string, path: string) => `cache:signedurl:${bucket}:${hashPath(path)}`,

    /** User profile data */
    profile: (userId: string) => `cache:profile:${userId}`,

    /** Streak leaderboard for an experience */
    leaderboard: (experienceId: string) => `cache:leaderboard:${experienceId}`,
};

// ============================================
// Cache TTL Values (in seconds)
// ============================================

export const CACHE_TTL = {
    /** Feed updates frequently - 60 seconds */
    FEED: 60,

    /** Members list - 5 minutes */
    MEMBERS: 5 * 60,

    /** Signed URLs - 30 minutes (Supabase URLs expire in 1 hour) */
    SIGNED_URL: 30 * 60,

    /** User profile - 5 minutes */
    PROFILE: 5 * 60,

    /** Leaderboard - 2 minutes */
    LEADERBOARD: 2 * 60,
};

// ============================================
// Cache Operations
// ============================================

/**
 * Get a cached value by key
 * @returns The cached value or null if not found/error
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        const cached = await redis.get<T>(key);
        return cached;
    } catch (error) {
        console.error('Cache get error:', error);
        return null; // Fail open - continue to DB
    }
}

/**
 * Set a value in cache with TTL
 * @param key Cache key
 * @param value Value to cache (will be JSON serialized)
 * @param ttlSeconds Time to live in seconds
 */
export async function cacheSet<T>(
    key: string,
    value: T,
    ttlSeconds: number
): Promise<boolean> {
    try {
        await redis.set(key, value, { ex: ttlSeconds });
        return true;
    } catch (error) {
        console.error('Cache set error:', error);
        return false; // Fail open - don't block on cache errors
    }
}

/**
 * Delete a cached value by key
 */
export async function cacheDel(key: string): Promise<boolean> {
    try {
        await redis.del(key);
        return true;
    } catch (error) {
        console.error('Cache delete error:', error);
        return false;
    }
}

/**
 * Delete multiple cached values by pattern
 * Useful for invalidating all related caches
 */
export async function cacheDelPattern(pattern: string): Promise<boolean> {
    try {
        // Scan for matching keys and delete them
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
        return true;
    } catch (error) {
        console.error('Cache pattern delete error:', error);
        return false;
    }
}

// ============================================
// Invalidation Helpers
// ============================================

/**
 * Invalidate feed cache for an experience
 * Call this after check-in create/delete
 */
export async function invalidateFeedCache(experienceId: string): Promise<void> {
    await cacheDel(CACHE_KEYS.feed(experienceId));
}

/**
 * Invalidate members cache for an experience
 * Call this after profile update or check-in create/delete
 */
export async function invalidateMembersCache(experienceId: string): Promise<void> {
    await cacheDel(CACHE_KEYS.members(experienceId));
}

/**
 * Invalidate user profile cache
 * Call this after profile update
 */
export async function invalidateProfileCache(userId: string): Promise<void> {
    await cacheDel(CACHE_KEYS.profile(userId));
}

/**
 * Invalidate all caches for an experience
 * Useful after major data changes
 */
export async function invalidateExperienceCaches(experienceId: string): Promise<void> {
    await Promise.all([
        invalidateFeedCache(experienceId),
        invalidateMembersCache(experienceId),
        cacheDel(CACHE_KEYS.leaderboard(experienceId)),
    ]);
}

// ============================================
// Utilities
// ============================================

/**
 * Simple hash function for storage paths to create shorter cache keys
 * Uses a basic djb2 hash algorithm
 */
function hashPath(path: string): string {
    let hash = 5381;
    for (let i = 0; i < path.length; i++) {
        hash = ((hash << 5) + hash) + path.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
}
