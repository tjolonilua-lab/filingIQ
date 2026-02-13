import { NextRequest, NextResponse } from 'next/server'
import { createAccount } from '@/lib/accounts'
import { z } from 'zod'

const signupSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  website: z.string().url('Invalid website URL'),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = signupSchema.parse(body)
    
    // Create account
    const account = await createAccount({
      companyName: validated.companyName,
      email: validated.email,
      password: validated.password,
      website: validated.website,
      slug: validated.slug, // Pass the slug if provided
    })

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
    
    if (error instanceof Error && error.message === 'Email already registered') {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      )
    }

    console.error('Signup error:', error)
    
    // Provide more specific error message
    let errorMessage = 'Failed to create account'
    if (error instanceof Error) {
      if (error.message.includes('read-only') || error.message.includes('EPERM') || error.message.includes('EROFS')) {
        errorMessage = 'File system is read-only. Please configure a database for production deployments.'
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

