/**
 * Whop Token Authentication
 * 
 * Middleware for verifying Whop user tokens in API routes
 */

import { NextRequest } from 'next/server';
import { getWhopUser } from './whop-sdk';

export interface WhopAuthResult {
  whopUserId: string;
  username: string | null;
  experienceId?: string;
}

/**
 * Verify Whop token from request headers
 * 
 * Extracts and verifies the x-whop-user-token header
 * Returns user information if valid, throws error if invalid
 * 
 * @param req - Next.js request object
 * @returns Authenticated user information
 * @throws Error if token is missing or invalid
 */
export async function verifyWhopToken(req: NextRequest): Promise<WhopAuthResult> {
  try {
    // Extract token from headers
    const token = req.headers.get('x-whop-user-token');

    if (!token) {
      throw {
        error: {
          code: 'MISSING_TOKEN',
          message: 'Authentication token is required',
        },
        status: 401,
      };
    }

    // Check if token is a JWT (starts with "eyJ") or a simple user ID
    let userId: string;
    
    if (token.startsWith('eyJ')) {
      // It's a JWT - decode it to get the user ID
      try {
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64').toString('utf-8')
        );
        userId = payload.sub; // JWT subject contains user ID
        
        if (!userId || !userId.startsWith('user_')) {
          throw new Error('Invalid user ID in JWT');
        }
      } catch (jwtError) {
        console.error('JWT decode error:', jwtError);
        throw {
          error: {
            code: 'INVALID_TOKEN_FORMAT',
            message: 'Invalid JWT token format',
          },
          status: 401,
        };
      }
    } else if (token.startsWith('user_')) {
      // Simple user ID format (legacy or dev mode)
      userId = token;
    } else {
      throw {
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Invalid authentication token format, expected JWT or user_...',
        },
        status: 401,
      };
    }

    // Development mode: skip Whop API verification for test user
    if (process.env.NODE_ENV === 'development' && userId === process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID) {
      const url = new URL(req.url);
      const experienceId = url.searchParams.get('experienceId') || undefined;
      
      return {
        whopUserId: userId,
        username: 'DevUser',
        experienceId,
      };
    }

    // Verify token by fetching the user from Whop API
    const user = await getWhopUser(userId);

    if (!user || !user.id) {
      throw {
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired authentication token',
        },
        status: 401,
      };
    }

    // Extract experience ID from query params if available
    const url = new URL(req.url);
    const experienceId = url.searchParams.get('experienceId') || undefined;

    return {
      whopUserId: user.id,
      username: user.username,
      experienceId,
    };
  } catch (error: any) {
    // Re-throw structured errors
    if (error.error && error.status) {
      throw error;
    }

    // Wrap unexpected errors
    console.error('verifyWhopToken error:', error);
    throw {
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
      status: 401,
    };
  }
}

/**
 * Extract Whop user ID from request (without full verification)
 * Use this for non-critical operations where you just need the user ID
 * 
 * @param req - Next.js request object
 * @returns Whop user ID or null
 */
export function extractWhopUserId(req: NextRequest): string | null {
  const token = req.headers.get('x-whop-user-token');
  
  if (!token || !token.startsWith('user_')) {
    return null;
  }

  return token;
}
