import { NextRequest } from 'next/server'
import { findAccountById } from '@/lib/accounts'
import { handleApiError, unauthorizedError, notFoundError, okResponse, sanitizeAccount } from '@/lib/api'
import { logger } from '@/lib/logger'
import { getSession } from '@/lib/auth/session'
import { getAccountIdFromRequest } from '@/lib/api/auth'

export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Get account ID from session cookie (preferred) or X-Account-Id header (for public pages)
    let accountId = await getSession()
    
    // Fallback to header if no session (for public pages like /start and /thank-you)
    if (!accountId) {
      accountId = getAccountIdFromRequest(request)
    }
    
    if (!accountId) {
      return unauthorizedError()
    }
    
    const account = await findAccountById(accountId)
    
    if (!account) {
      return notFoundError('Account not found')
    }

    // Return account (without password hash)
    return okResponse({ account: sanitizeAccount(account) })
  } catch (error) {
    logger.error('Get account error', error as Error)
    return handleApiError(error)
  }
}

