import { NextRequest, NextResponse } from 'next/server'
import { findAccountById } from '@/lib/accounts'

export async function GET(request: NextRequest) {
  try {
    // Get account ID from header (set by client after login)
    const accountId = request.headers.get('X-Account-Id')
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const account = await findAccountById(accountId)
    
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
    console.error('Get account error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get account' },
      { status: 500 }
    )
  }
}

