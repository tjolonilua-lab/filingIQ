import { NextRequest, NextResponse } from 'next/server'
import { findAccountBySlug } from '@/lib/accounts'

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug')
    
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug required' },
        { status: 400 }
      )
    }

    const account = await findAccountBySlug(slug)
    
    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    // Return account (without password hash)
    const { passwordHash, ...accountWithoutPassword } = account
    
    return NextResponse.json({
      success: true,
      account: accountWithoutPassword,
    })
  } catch (error) {
    console.error('Lookup account error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to lookup account' },
      { status: 500 }
    )
  }
}

