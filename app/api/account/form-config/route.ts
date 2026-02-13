import { NextRequest } from 'next/server'
import { updateAccountSettings, getFormConfig } from '@/lib/accounts'
import { FormConfiguration, validateFormConfig, defaultFormConfig } from '@/lib/form-config'
import { handleApiError, handleZodError, unauthorizedError, validationError, okResponse } from '@/lib/api'
import { requireAccountId } from '@/lib/api/auth'
import { logger } from '@/lib/logger'

// GET: Retrieve form configuration
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const accountId = requireAccountId(request)
    const config = await getFormConfig(accountId)
    
    return okResponse({ config })
  } catch (error) {
    if (error instanceof Error && error.message === 'Account ID required') {
      return unauthorizedError()
    }
    logger.error('Get form config error', error as Error)
    return handleApiError(error)
  }
}

// POST: Update form configuration
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const accountId = requireAccountId(request)
    const body = await request.json()
    const config = body.config as FormConfiguration

    // Validate configuration
    const validation = validateFormConfig(config)
    if (!validation.valid) {
      return validationError(
        `Invalid form configuration: ${validation.errors.join(', ')}`
      )
    }

    // Update account settings with form config
    await updateAccountSettings(accountId, { formConfig: config })
    
    return okResponse({}, 'Form configuration saved successfully')
  } catch (error) {
    if (error instanceof Error && error.message === 'Account ID required') {
      return unauthorizedError()
    }
    logger.error('Update form config error', error as Error)
    return handleApiError(error)
  }
}

// PUT: Reset to default configuration (clear custom config)
export async function PUT(request: NextRequest): Promise<Response> {
  try {
    const accountId = requireAccountId(request)

    // Clear custom config by setting it to undefined (will use default)
    await updateAccountSettings(accountId, { formConfig: undefined })
    
    return okResponse({
      config: defaultFormConfig,
    }, 'Form configuration reset to default')
  } catch (error) {
    if (error instanceof Error && error.message === 'Account ID required') {
      return unauthorizedError()
    }
    logger.error('Reset form config error', error as Error)
    return handleApiError(error)
  }
}

