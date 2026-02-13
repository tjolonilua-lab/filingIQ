import { NextRequest } from 'next/server'
import { findAccountByEmail } from '@/lib/accounts'
import { createPasswordResetTokenDB } from '@/lib/db'
import { z } from 'zod'
import { handleApiError, handleZodError, okResponse } from '@/lib/api'
import { API_MESSAGES } from '@/lib/constants'
import { logger } from '@/lib/logger'
import { withRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit'

// Dynamic import to work around Turbopack module resolution issue
const getSendPasswordResetEmail = async () => {
  const emailModule = await import('@/lib/email')
  return emailModule.sendPasswordResetEmail
}

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const forgotPasswordHandler = async (request: NextRequest) => {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = forgotPasswordSchema.parse(body)
    
    // Find account by email
    const account = await findAccountByEmail(validated.email)
    
    // Always return success (don't reveal if email exists)
    // This prevents email enumeration attacks
    if (account) {
      try {
        // Create reset token
        const token = await createPasswordResetTokenDB(account.id)
        
        // Send reset email
        const sendPasswordResetEmail = await getSendPasswordResetEmail()
        await sendPasswordResetEmail(account.email, account.companyName, token)
        
        logger.info('Password reset token created', { accountId: account.id })
      } catch (error) {
        // Log error but don't reveal it to user
        logger.error('Error creating password reset token', error as Error, { accountId: account.id })
      }
    }
    
    // Always return success message (security best practice)
    return okResponse({}, API_MESSAGES.PASSWORD_RESET_SENT)
  } catch (error) {
    const zodError = handleZodError(error)
    if (zodError) return zodError
    
    return handleApiError(error)
  }
}

// Apply rate limiting (3 attempts per hour per email)
export const POST = withRateLimit(
  forgotPasswordHandler,
  RATE_LIMITS.PASSWORD_RESET,
  async (req) => {
    try {
      const body = await req.json()
      return body?.email // Rate limit by email
    } catch {
      return undefined
    }
  }
)

// Apply rate limiting (3 attempts per hour per email)
export const POST = withRateLimit(
  forgotPasswordHandler,
  RATE_LIMITS.PASSWORD_RESET,
  async (req) => {
    try {
      const body = await req.json()
      return body?.email // Rate limit by email
    } catch {
      return undefined
    }
  }
)
