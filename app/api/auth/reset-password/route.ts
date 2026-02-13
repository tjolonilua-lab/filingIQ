import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/accounts'
import {
  validatePasswordResetTokenDB,
  markPasswordResetTokenUsedDB,
  updateAccountPasswordDB,
} from '@/lib/db'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = resetPasswordSchema.parse(body)
    
    // Validate token
    const tokenData = await validatePasswordResetTokenDB(validated.token)
    
    if (!tokenData) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }
    
    // Hash new password
    const passwordHash = await hashPassword(validated.password)
    
    // Update password
    await updateAccountPasswordDB(tokenData.accountId, passwordHash)
    
    // Mark token as used
    await markPasswordResetTokenUsedDB(validated.token)
    
    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Reset password error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
