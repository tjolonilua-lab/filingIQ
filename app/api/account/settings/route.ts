import { NextRequest } from 'next/server'
import { updateAccountSettings } from '@/lib/accounts'
import { z } from 'zod'
import { handleApiError, handleZodError, okResponse, unauthorizedError, sanitizeAccount } from '@/lib/api'
import { requireAccountId } from '@/lib/api/auth'

const settingsSchema = z.object({
  phone: z.string().optional(),
  mainWebsiteUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
})

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const accountId = requireAccountId(request)
    const body = await request.json()
    const validated = settingsSchema.parse(body)
    
    const account = await updateAccountSettings(accountId, validated)
    
    return okResponse({ account: sanitizeAccount(account) })
  } catch (error) {
    const zodError = handleZodError(error)
    if (zodError) return zodError
    
    if (error instanceof Error && error.message === 'Account ID required') {
      return unauthorizedError()
    }
    
    return handleApiError(error)
  }
}

