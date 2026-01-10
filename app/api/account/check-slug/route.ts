import { NextRequest, NextResponse } from 'next/server'
import { isSlugAvailable } from '@/lib/accounts'

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug')
    const excludeAccountId = request.nextUrl.searchParams.get('excludeAccountId') || undefined
    
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug required' },
        { status: 400 }
      )
    }

    const available = await isSlugAvailable(slug, excludeAccountId)
    
    return NextResponse.json({
      success: true,
      available,
      slug: slug.toLowerCase().trim(),
    })
  } catch (error) {
    console.error('Check slug error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check slug availability' },
      { status: 500 }
    )
  }
}

