import { NextRequest } from 'next/server'
import { findAccountBySlug } from '@/lib/accounts'
import { handleApiError, validationError, notFoundError, okResponse, sanitizeAccount } from '@/lib/api'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const slug = request.nextUrl.searchParams.get('slug')
    
    if (!slug) {
      return validationError('Slug required')
    }

    const account = await findAccountBySlug(slug)
    
    if (!account) {
      return notFoundError('Account not found')
    }

    // Return account (without password hash)
    return okResponse({ account: sanitizeAccount(account) })
  } catch (error) {
    logger.error('Lookup account error', error as Error, { slug: request.nextUrl.searchParams.get('slug') })
    return handleApiError(error)
  }
}

