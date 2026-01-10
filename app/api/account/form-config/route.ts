import { NextRequest, NextResponse } from 'next/server'
import { findAccountById, updateAccountSettings, getFormConfig } from '@/lib/accounts'
import { FormConfiguration, validateFormConfig, defaultFormConfig } from '@/lib/form-config'

// GET: Retrieve form configuration
export async function GET(request: NextRequest) {
  try {
    const accountId = request.headers.get('X-Account-Id')
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const config = await getFormConfig(accountId)
    
    return NextResponse.json({
      success: true,
      config,
    })
  } catch (error) {
    console.error('Get form config error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get form configuration' },
      { status: 500 }
    )
  }
}

// POST: Update form configuration
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
    const config = body.config as FormConfiguration

    // Validate configuration
    const validation = validateFormConfig(config)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid form configuration', errors: validation.errors },
        { status: 400 }
      )
    }

    // Update account settings with form config
    await updateAccountSettings(accountId, { formConfig: config })
    
    return NextResponse.json({
      success: true,
      message: 'Form configuration saved successfully',
    })
  } catch (error) {
    console.error('Update form config error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update form configuration' },
      { status: 500 }
    )
  }
}

// PUT: Reset to default configuration (clear custom config)
export async function PUT(request: NextRequest) {
  try {
    const accountId = request.headers.get('X-Account-Id')
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Clear custom config by setting it to null (will use default)
    await updateAccountSettings(accountId, { formConfig: null })
    
    return NextResponse.json({
      success: true,
      config: defaultFormConfig,
      message: 'Form configuration reset to default',
    })
  } catch (error) {
    console.error('Reset form config error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to reset form configuration' },
      { status: 500 }
    )
  }
}

