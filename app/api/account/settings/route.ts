import { NextRequest, NextResponse } from 'next/server'
import { updateAccountSettings } from '@/lib/accounts'
import { z } from 'zod'

const settingsSchema = z.object({
  phone: z.string().optional(),
  mainWebsiteUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
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
    const validated = settingsSchema.parse(body)
    
    const account = await updateAccountSettings(accountId, validated)
    
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

    console.error('Update settings error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

