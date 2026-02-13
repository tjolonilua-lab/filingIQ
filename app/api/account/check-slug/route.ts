import { NextRequest, NextResponse } from 'next/server'
import { isSlugAvailable } from '@/lib/accounts'
import { handleApiError, validationError } from '@/lib/api'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const slug = request.nextUrl.searchParams.get('slug')
    const excludeAccountId = request.nextUrl.searchParams.get('excludeAccountId') || undefined
    
    if (!slug) {
      return validationError('Slug required')
    }

    const available = await isSlugAvailable(slug, excludeAccountId)
    
    // Return response with available and slug at top level for easier access
    return NextResponse.json({
      success: true,
      available,
      slug: slug.toLowerCase().trim(),
    }, { status: 200 })
  } catch (error) {
    logger.error('Check slug error', error as Error, { slug: request.nextUrl.searchParams.get('slug') })
    return handleApiError(error)
  }
}

