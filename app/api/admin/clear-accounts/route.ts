import { NextRequest } from 'next/server'
import { deleteAllAccounts, deleteAccountByEmail, resetPassword } from '@/lib/accounts'
import { okResponse, handleApiError, validationError, unauthorizedError } from '@/lib/api'
import { logger } from '@/lib/logger'
import { verifyAdminAuth } from '@/lib/api/auth'
import { z } from 'zod'

/**
 * Admin account management endpoint
 * 
 * DELETE /api/admin/clear-accounts - Delete all accounts
 * POST /api/admin/clear-accounts - Delete account by email OR reset password
 * 
 * SECURITY: Requires ADMIN_PASSWORD in Authorization header (Bearer token)
 * In development, this check is bypassed for convenience.
 * 
 * WARNING: This is a destructive operation. Use only for development/testing.
 */

const deleteByEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
})

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * Verify admin authentication
 * In production, requires ADMIN_PASSWORD. In development, allows for testing.
 */
function requireAdminAuth(request: NextRequest): boolean {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isLocalhost = request.headers.get('host')?.includes('localhost') || 
                      request.headers.get('host')?.includes('127.0.0.1')
  
  // In development/localhost, allow without auth for convenience
  if (isDevelopment || isLocalhost) {
    logger.warn('Admin endpoint accessed without auth in development mode', {
      host: request.headers.get('host'),
      nodeEnv: process.env.NODE_ENV
    })
    return true
  }
  
  // In production, require admin password
  return verifyAdminAuth(request)
}

// DELETE: Clear all accounts
export async function DELETE(request: NextRequest): Promise<Response> {
  try {
    // Require admin authentication
    if (!requireAdminAuth(request)) {
      return unauthorizedError('Admin authentication required. Provide ADMIN_PASSWORD in Authorization header.')
    }
    
    logger.warn('Clearing all accounts - this is a destructive operation')
    const count = await deleteAllAccounts()
    
    return okResponse({ 
      message: 'All accounts cleared successfully',
      deletedCount: count 
    })
  } catch (error) {
    logger.error('Error clearing all accounts', error as Error)
    return handleApiError(error)
  }
}

// POST: Delete account by email OR reset password
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Require admin authentication
    if (!requireAdminAuth(request)) {
      return unauthorizedError('Admin authentication required. Provide ADMIN_PASSWORD in Authorization header.')
    }
    
    const body = await request.json()
    
    // Check if this is a password reset request
    if ('password' in body) {
      const validated = resetPasswordSchema.parse(body)
      
      const reset = await resetPassword(validated.email, validated.password)
      
      if (!reset) {
        return validationError('Account with this email not found')
      }
      
      logger.warn('Password reset via admin endpoint', { email: validated.email })
      
      return okResponse({ 
        message: 'Password reset successfully',
        email: validated.email,
        newPassword: validated.password // Return for convenience in dev/testing
      })
    }
    
    // Otherwise, delete account by email
    const validated = deleteByEmailSchema.parse(body)
    
    const deleted = await deleteAccountByEmail(validated.email)
    
    if (!deleted) {
      return validationError('Account with this email not found')
    }
    
    logger.warn('Account deleted via admin endpoint', { email: validated.email })
    
    return okResponse({ 
      message: 'Account deleted successfully',
      email: validated.email 
    })
  } catch (error) {
    const zodError = error instanceof z.ZodError
      ? validationError(error.errors[0]?.message || 'Invalid request')
      : null
    
    if (zodError) return zodError
    
    logger.error('Error in admin account operation', error as Error)
    return handleApiError(error)
  }
}
