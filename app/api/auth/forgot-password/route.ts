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
        
        logger.info('Password reset email sent successfully', { 
          accountId: account.id,
          email: account.email,
          hasResendKey: !!process.env.RESEND_API_KEY,
          fromEmail: process.env.RESEND_FROM_EMAIL || 'not-set'
        })
      } catch (error) {
        // Log detailed error but don't reveal it to user
        const errorDetails = error instanceof Error ? {
          message: error.message,
          name: error.name,
          stack: error.stack
        } : error
        logger.error('Error sending password reset email', error as Error, { 
          accountId: account.id,
          email: account.email,
          hasResendKey: !!process.env.RESEND_API_KEY,
          errorDetails
        })
      }
    } else {
      // Log that email was not found (for debugging, but don't reveal to user)
      logger.info('Password reset requested for non-existent email', { 
        requestedEmail: validated.email 
      })
    }
    
    // Always return success message (security best practice)
    return okResponse({}, API_MESSAGES.PASSWORD_RESET_SENT)
  } catch (error) {
    const zodError = handleZodError(error)
    if (zodError) return zodError
    
    return handleApiError(error)
  }
}

// Apply rate limiting (3 attempts per hour per IP)
// Note: We intentionally DON'T read the body here to avoid
// \"Body is unusable: Body has already been read\" errors.
// Rate limiting by IP is sufficient for this endpoint.
export const POST = withRateLimit(
  forgotPasswordHandler,
  RATE_LIMITS.PASSWORD_RESET
)
