import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ============================================
// Rate Limiters (Sliding Window Algorithm)
// ============================================

/** Strict limiter for file uploads - 10 requests per minute */
export const uploadLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'ratelimit:upload',
});

/** Very strict limiter for avatar uploads - 5 requests per minute */
export const avatarLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    prefix: 'ratelimit:avatar',
});

/** Moderate limiter for write operations - 20 requests per minute */
export const writeLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    prefix: 'ratelimit:write',
});

/** Relaxed limiter for read operations - 60 requests per minute */
export const readLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'ratelimit:read',
});

/** Limiter for signed URL requests - 30 requests per minute (with client caching) */
export const signedUrlLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    prefix: 'ratelimit:signed-url',
});

/** Global fallback limiter - 100 requests per minute */
export const globalLimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'ratelimit:global',
});

// ============================================
// IP Extraction (Hardened)
// ============================================

/** Valid IPv4 regex */
const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;

/** Valid IPv6 regex (simplified) */
const IPV6_REGEX = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

/**
 * Validates if a string is a valid IP address
 */
function isValidIp(ip: string): boolean {
    return IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip);
}

/**
 * Extracts and validates the client IP address from the request.
 * Handles proxy chains and validates IP format to prevent spoofing.
 * 
 * Priority:
 * 1. x-forwarded-for (first valid IP in chain)
 * 2. x-real-ip
 * 3. Fallback to 'unknown'
 */
export function getClientIp(request: NextRequest): string {
    // Try x-forwarded-for first (may contain proxy chain: "client, proxy1, proxy2")
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        // Split by comma and get the first (original client) IP
        const ips = forwardedFor.split(',').map(ip => ip.trim());
        for (const ip of ips) {
            if (isValidIp(ip)) {
                return ip;
            }
        }
    }

    // Try x-real-ip
    const realIp = request.headers.get('x-real-ip');
    if (realIp && isValidIp(realIp)) {
        return realIp;
    }

    // Fallback - use a generic identifier (still rate limited)
    return 'unknown';
}

// ============================================
// Rate Limit Check & Response
// ============================================

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    response?: NextResponse;
}

/**
 * Creates a standardized 429 Too Many Requests response
 */
export function rateLimitResponse(
    reset: number,
    limit: number,
    remaining: number
): NextResponse {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);

    return NextResponse.json(
        {
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.max(retryAfter, 1),
        },
        {
            status: 429,
            headers: {
                'Retry-After': String(Math.max(retryAfter, 1)),
                'X-RateLimit-Limit': String(limit),
                'X-RateLimit-Remaining': String(remaining),
                'X-RateLimit-Reset': String(reset),
            },
        }
    );
}

/**
 * Checks rate limit for a given identifier.
 * Returns a result object with success status and optional 429 response.
 * 
 * @param limiter - The rate limiter to use
 * @param identifier - User ID for auth routes, IP for public routes
 * @returns RateLimitResult with success boolean and optional response
 * 
 * @example
 * // For auth routes (use whopId)
 * const result = await checkRateLimit(writeLimiter, whopId);
 * if (!result.success) return result.response!;
 * 
 * @example
 * // For public routes (use IP)
 * const result = await checkRateLimit(readLimiter, getClientIp(request));
 * if (!result.success) return result.response!;
 */
export async function checkRateLimit(
    limiter: Ratelimit,
    identifier: string
): Promise<RateLimitResult> {
    try {
        const { success, limit, remaining, reset } = await limiter.limit(identifier);

        if (!success) {
            return {
                success: false,
                limit,
                remaining,
                reset,
                response: rateLimitResponse(reset, limit, remaining),
            };
        }

        return { success: true, limit, remaining, reset };
    } catch (error) {
        // If Redis is down, allow the request (fail open)
        // Log the error for monitoring
        console.error('Rate limit check failed:', error);
        return { success: true, limit: 0, remaining: 0, reset: 0 };
    }
}

/**
 * Convenience function to add rate limit headers to a successful response.
 * Call this after checkRateLimit succeeds if you want to include rate limit info.
 */
export function addRateLimitHeaders(
    response: NextResponse,
    result: RateLimitResult
): NextResponse {
    response.headers.set('X-RateLimit-Limit', String(result.limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(result.reset));
    return response;
}
