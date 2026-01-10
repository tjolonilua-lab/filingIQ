import { NextRequest, NextResponse } from 'next/server'
import { findAccountByEmail, createAccount } from '@/lib/accounts'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = loginSchema.parse(body)
    
    // Find or create account (development mode - accept any credentials)
    let account = await findAccountByEmail(validated.email)
    
    if (!account) {
      // Auto-create account if it doesn't exist
      try {
        account = await createAccount({
          companyName: validated.email.split('@')[0] || 'Test Company',
          email: validated.email,
          password: validated.password,
          website: 'example.com',
        })
      } catch (error) {
        console.error('Error creating account:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to create account' },
          { status: 500 }
        )
      }
    }

    // Skip password verification in development mode
    // In production, uncomment this:
    // if (!verifyPassword(validated.password, account.passwordHash)) {
    //   return NextResponse.json(
    //     { success: false, error: 'Invalid email or password' },
    //     { status: 401 }
    //   )
    // }

    // Return account (without password hash)
    const { passwordHash, ...accountWithoutPassword } = account
    
    return NextResponse.json({
      success: true,
      account: accountWithoutPassword,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to login' },
      { status: 500 }
    )
  }
}

