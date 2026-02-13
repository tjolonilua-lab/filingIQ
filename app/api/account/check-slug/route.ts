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

    const normalizedSlug = slug.toLowerCase().trim()
    
    // Validate slug format first
    if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
      return NextResponse.json({
        success: true,
        available: false,
        slug: normalizedSlug,
        reason: 'Invalid format - only lowercase letters, numbers, and hyphens allowed',
      }, { status: 200 })
    }

    const available = await isSlugAvailable(normalizedSlug, excludeAccountId)
    
    // Return response with available and slug at top level for easier access
    return NextResponse.json({
      success: true,
      available,
      slug: normalizedSlug,
    }, { status: 200 })
  } catch (error) {
    logger.error('Check slug error', error as Error, { slug: request.nextUrl.searchParams.get('slug') })
    return handleApiError(error)
  }
}

