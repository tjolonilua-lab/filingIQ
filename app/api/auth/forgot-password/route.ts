import { NextRequest, NextResponse } from 'next/server'
import { findAccountByEmail } from '@/lib/accounts'
import { createPasswordResetTokenDB } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = forgotPasswordSchema.parse(body)
    
    // Find account by email
    const account = await findAccountByEmail(validated.email)
    
    // Always return success (don't reveal if email exists)
    // This prevents email enumeration attacks
    if (account) {
      try {
        // Create reset token
        const token = await createPasswordResetTokenDB(account.id)
        
        // Send reset email
        await sendPasswordResetEmail(account.email, account.companyName, token)
        
        console.log(`Password reset token created for account: ${account.id}`)
      } catch (error) {
        // Log error but don't reveal it to user
        console.error('Error creating password reset token:', error)
      }
    }
    
    // Always return success message (security best practice)
    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Forgot password error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
