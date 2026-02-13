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

// Read body before middleware to avoid "Body has already been read" errors
async function handleLogin(request: NextRequest): Promise<Response> {
  // Read body immediately before any middleware processing
  let body: unknown
  try {
    body = await request.json()
  } catch (error) {
    return handleApiError(new Error('Invalid request body format'))
  }

  // Now wrap with correlation ID and rate limiting
  const loginHandler = withCorrelationId(async (_req: NextRequest, correlationId: string) => {
    try {
      // Validate input (body already parsed above)
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
  // Note: Body is already read above, so rate limiter won't try to read it
  return withRateLimit(loginHandler, RATE_LIMITS.LOGIN)(request)
}

export const POST = handleLogin

