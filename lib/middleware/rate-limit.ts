import { NextRequest, NextResponse } from 'next/server'
import { logger } from '../logger'

/**
 * Rate limiting middleware
 * 
 * Provides in-memory rate limiting to protect against brute force attacks.
 * For production, consider using Redis-based rate limiting (e.g., Upstash).
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

// In-memory store (clears on server restart)
// For production, use Redis or similar
const rateLimitStore: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetAt < now) {
      delete rateLimitStore[key]
    }
  }
}, 5 * 60 * 1000)

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  message?: string
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  LOGIN: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many login attempts. Please try again later.',
  },
  PASSWORD_RESET: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many password reset requests. Please try again later.',
  },
  SIGNUP: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many signup attempts. Please try again later.',
  },
  API: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests. Please slow down.',
  },
} as const

/**
 * Get rate limit key from request
 * 
 * Creates a unique key for rate limiting based on IP address and optional identifier.
 * 
 * @param request - The Next.js request object
 * @param identifier - Optional additional identifier (e.g., email)
 * @returns A unique key for rate limiting
 */
function getRateLimitKey(request: NextRequest, identifier?: string): string {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  const baseKey = `rate-limit:${ip}`
  return identifier ? `${baseKey}:${identifier}` : baseKey
}

/**
 * Check if request should be rate limited
 * 
 * @param key - The rate limit key
 * @param config - Rate limit configuration
 * @returns Object with allowed flag and remaining requests
 */
function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitStore[key]

  // No entry or expired - allow and create new entry
  if (!entry || entry.resetAt < now) {
    rateLimitStore[key] = {
      count: 1,
      resetAt: now + config.windowMs,
    }
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    }
  }

  // Entry exists and not expired
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Rate limiting middleware wrapper
 * 
 * Wraps an API route handler with rate limiting. Automatically checks
 * rate limits and returns 429 Too Many Requests if exceeded.
 * 
 * @param handler - The API route handler
 * @param config - Rate limit configuration
 * @param getIdentifier - Optional function to extract identifier from request
 * @returns Wrapped handler with rate limiting
 * 
 * @example
 * ```typescript
 * export const POST = withRateLimit(
 *   async (req) => { /* handler */ },
 *   RATE_LIMITS.LOGIN,
 *   (req) => req.body?.email // Rate limit by email
 * )
 * ```
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  config: RateLimitConfig,
  getIdentifier?: (req: NextRequest) => Promise<string | undefined> | string | undefined
) {
  return async (req: NextRequest): Promise<Response> => {
    const identifier = getIdentifier ? await getIdentifier(req) : undefined
    const key = getRateLimitKey(req, identifier)
    const { allowed, remaining, resetAt } = checkRateLimit(key, config)

    // Add rate limit headers
    const response = allowed
      ? await handler(req)
      : NextResponse.json(
          {
            success: false,
            error: config.message || 'Too many requests',
          },
          { status: 429 }
        )

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests))
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)))
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)))

    if (!allowed) {
      logger.warn('Rate limit exceeded', {
        key,
        identifier,
        path: req.nextUrl.pathname,
      })
    }

    return response
  }
}
