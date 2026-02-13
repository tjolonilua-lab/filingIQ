import { NextRequest } from 'next/server'
import { isSlugAvailable } from '@/lib/accounts'
import { handleApiError, validationError, okResponse } from '@/lib/api'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const slug = request.nextUrl.searchParams.get('slug')
    const excludeAccountId = request.nextUrl.searchParams.get('excludeAccountId') || undefined
    
    if (!slug) {
      return validationError('Slug required')
    }

    const available = await isSlugAvailable(slug, excludeAccountId)
    
    return okResponse({
      available,
      slug: slug.toLowerCase().trim(),
    })
  } catch (error) {
    logger.error('Check slug error', error as Error, { slug: request.nextUrl.searchParams.get('slug') })
    return handleApiError(error)
  }
}

