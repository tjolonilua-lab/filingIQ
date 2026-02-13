import { NextRequest } from 'next/server'
import { findAccountByEmail, verifyPassword } from '@/lib/accounts'
import { z } from 'zod'
import { handleApiError, handleZodError, okResponse, unauthorizedError, sanitizeAccount } from '@/lib/api'
import { API_MESSAGES } from '@/lib/constants'
import { logger } from '@/lib/logger'
import { withCorrelationId } from '@/lib/middleware/correlation'
import { withRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { createSession } from '@/lib/auth/session'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const loginHandler = withCorrelationId(async (request: NextRequest, correlationId: string) => {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = loginSchema.parse(body)
    
    // Find account (do not auto-create - security best practice)
    const account = await findAccountByEmail(validated.email)
    
    if (!account) {
      // Don't reveal if account exists (prevent enumeration)
      return unauthorizedError(API_MESSAGES.INVALID_CREDENTIALS)
    }

    // Verify password
    if (!(await verifyPassword(validated.password, account.passwordHash))) {
      return unauthorizedError(API_MESSAGES.INVALID_CREDENTIALS)
    }

    // Create secure session with httpOnly cookie
    await createSession(account.id)

    // Return account (without password hash)
    return okResponse({ account: sanitizeAccount(account) })
  } catch (error) {
    const zodError = handleZodError(error)
    if (zodError) return zodError
    
    logger.error('Login error', error as Error, { correlationId })
    return handleApiError(error)
  }
})

// Apply rate limiting (5 attempts per 15 minutes per IP)
export const POST = withRateLimit(
  loginHandler,
  RATE_LIMITS.LOGIN,
  async (req) => {
    try {
      const body = await req.json()
      return body?.email // Rate limit by email
    } catch {
      return undefined
    }
  }
)

