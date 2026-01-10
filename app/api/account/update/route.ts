import { NextRequest, NextResponse } from 'next/server'
import { updateAccount } from '@/lib/accounts'
import { z } from 'zod'

const updateSchema = z.object({
  companyName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const accountId = request.headers.get('X-Account-Id')
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = updateSchema.parse(body)
    
    const account = await updateAccount(accountId, validated)
    
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

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    console.error('Update account error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update account' },
      { status: 500 }
    )
  }
}

