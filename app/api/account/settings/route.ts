import { NextRequest } from 'next/server'
import { findAccountById, updateAccountSettings, getFormConfig } from '@/lib/accounts'
import { z } from 'zod'
import { handleApiError, handleZodError, okResponse, unauthorizedError, sanitizeAccount } from '@/lib/api'
import { requireAccountId, getAccountIdFromRequest } from '@/lib/api/auth'
import { getSession } from '@/lib/auth/session'

const settingsSchema = z.object({
  phone: z.string().optional(),
  mainWebsiteUrl: z.string().url().optional().or(z.literal('')),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
})

// GET - Retrieve account settings
export async function GET(request: NextRequest): Promise<Response> {
  try {
    // Get account ID from session (preferred) or header (fallback)
    let accountId = await getSession()
    if (!accountId) {
      accountId = getAccountIdFromRequest(request) || null
    }
    
    if (!accountId) {
      return unauthorizedError()
    }
    
    const account = await findAccountById(accountId)
    
    if (!account) {
      return unauthorizedError('Account not found')
    }
    
    // Get form config if it exists
    const formConfig = await getFormConfig(accountId).catch(() => null)
    
    return okResponse({
      account: sanitizeAccount(account),
      settings: account.settings || {},
      formConfig: formConfig,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Account ID required') {
      return unauthorizedError()
    }
    
    return handleApiError(error)
  }
}

// POST - Update account settings
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

