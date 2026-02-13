import { NextRequest } from 'next/server'
import { updateAccount } from '@/lib/accounts'
import { z } from 'zod'
import { handleApiError, handleZodError, okResponse, unauthorizedError, sanitizeAccount } from '@/lib/api'
import { requireAccountId } from '@/lib/api/auth'
import { MIN_SLUG_LENGTH, MAX_SLUG_LENGTH, SLUG_REGEX } from '@/lib/constants'

const updateSchema = z.object({
  companyName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  slug: z.string()
    .min(MIN_SLUG_LENGTH, `Slug must be at least ${MIN_SLUG_LENGTH} characters`)
    .max(MAX_SLUG_LENGTH, `Slug must be less than ${MAX_SLUG_LENGTH} characters`)
    .regex(SLUG_REGEX, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
})

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const accountId = requireAccountId(request)
    const body = await request.json()
    const validated = updateSchema.parse(body)
    
    const account = await updateAccount(accountId, validated)
    
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

