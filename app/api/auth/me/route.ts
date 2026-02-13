import { NextRequest } from 'next/server'
import { findAccountById } from '@/lib/accounts'
import { handleApiError, unauthorizedError, notFoundError, okResponse, sanitizeAccount } from '@/lib/api'
import { logger } from '@/lib/logger'
import { getSession } from '@/lib/auth/session'

export async function GET(_request: NextRequest): Promise<Response> {
  try {
    // Get account ID from httpOnly cookie session
    const accountId = await getSession()
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

