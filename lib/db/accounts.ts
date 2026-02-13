import { sql } from './client'
import type { CompanyAccount } from '../accounts'
import { RESERVED_SLUGS } from '../constants'
import { logger } from '../logger'
import { mapAccountRow, isAccountRow } from '../types/db'

/**
 * Account database operations
 */

// Load all accounts from database
export async function loadAccountsFromDB(): Promise<CompanyAccount[]> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  try {
    const result = await sql`
      SELECT 
        id::text,
        company_name as "companyName",
        email,
        password_hash as "passwordHash",
        website,
        slug,
        created_at::text as "createdAt",
        settings
      FROM accounts
      ORDER BY created_at DESC
    `
    
    const rows = result as unknown[]
    return rows
      .filter(isAccountRow)
      .map(mapAccountRow)
  } catch (error) {
    logger.error('Error loading accounts from database', error as Error)
    throw error
  }
}

// Find account by email
export async function findAccountByEmailDB(email: string): Promise<CompanyAccount | null> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  try {
    const result = await sql`
      SELECT 
        id::text,
        company_name as "companyName",
        email,
        password_hash as "passwordHash",
        website,
        slug,
        created_at::text as "createdAt",
        settings
      FROM accounts
      WHERE email = ${email}
      LIMIT 1
    `
    
    const rows = result as unknown[]
    if (rows.length === 0 || !isAccountRow(rows[0])) {
      return null
    }
    
    return mapAccountRow(rows[0])
  } catch (error) {
    logger.error('Error finding account by email', error as Error, { email })
    throw error
  }
}

// Find account by ID
export async function findAccountByIdDB(id: string): Promise<CompanyAccount | null> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  try {
    const result = await sql`
      SELECT 
        id::text,
        company_name as "companyName",
        email,
        password_hash as "passwordHash",
        website,
        slug,
        created_at::text as "createdAt",
        settings
      FROM accounts
      WHERE id = ${id}::uuid
      LIMIT 1
    `
    
    const rows = result as unknown[]
    if (rows.length === 0 || !isAccountRow(rows[0])) {
      return null
    }
    
    return mapAccountRow(rows[0])
  } catch (error) {
    logger.error('Error finding account by ID', error as Error, { id })
    throw error
  }
}

// Find account by slug
export async function findAccountBySlugDB(slug: string): Promise<CompanyAccount | null> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  try {
    const result = await sql`
      SELECT 
        id::text,
        company_name as "companyName",
        email,
        password_hash as "passwordHash",
        website,
        slug,
        created_at::text as "createdAt",
        settings
      FROM accounts
      WHERE LOWER(slug) = LOWER(${slug})
      LIMIT 1
    `
    
    const rows = result as unknown[]
    if (rows.length === 0 || !isAccountRow(rows[0])) {
      return null
    }
    
    return mapAccountRow(rows[0])
  } catch (error) {
    logger.error('Error finding account by slug', error as Error, { slug })
    throw error
  }
}

// Check if slug is available
export async function isSlugAvailableDB(slug: string, excludeAccountId?: string): Promise<boolean> {
  try {
    const normalizedSlug = slug.toLowerCase().trim()
    
    // Check reserved slugs
    if (RESERVED_SLUGS.includes(normalizedSlug)) {
      return false
    }
    
    // Check if slug matches pattern
    if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
      return false
    }
    
    if (!sql) {
      throw new Error('Database not configured')
    }
    
    // Check if slug already exists
    let result
    if (excludeAccountId) {
      result = await sql`
        SELECT COUNT(*) as count
        FROM accounts
        WHERE LOWER(slug) = LOWER(${normalizedSlug})
        AND id != ${excludeAccountId}::uuid
      `
    } else {
      result = await sql`
        SELECT COUNT(*) as count
        FROM accounts
        WHERE LOWER(slug) = LOWER(${normalizedSlug})
      `
    }
    
    const rows = result as any[]
    return parseInt(rows[0]?.count || '0') === 0
  } catch (error) {
    logger.error('Error checking slug availability', error as Error, { slug })
    throw error
  }
}

// Create new account
export async function createAccountDB(data: {
  id: string
  companyName: string
  email: string
  passwordHash: string
  website: string
  slug: string
  createdAt: string
  settings?: Record<string, unknown>
}): Promise<CompanyAccount> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  try {
    await sql`
      INSERT INTO accounts (
        id,
        company_name,
        email,
        password_hash,
        website,
        slug,
        created_at,
        settings
      ) VALUES (
        ${data.id}::uuid,
        ${data.companyName},
        ${data.email},
        ${data.passwordHash},
        ${data.website},
        ${data.slug},
        ${data.createdAt}::timestamp,
        ${JSON.stringify(data.settings || {})}::jsonb
      )
    `
    
    return {
      id: data.id,
      companyName: data.companyName,
      email: data.email,
      passwordHash: data.passwordHash,
      website: data.website,
      slug: data.slug,
      createdAt: data.createdAt,
      settings: data.settings || {},
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // Unique constraint violation
      const errorMessage = (error as { message?: string }).message || ''
      if (errorMessage.includes('email') || errorMessage.includes('accounts_email')) {
        throw new Error('Email already registered')
      }
      if (errorMessage.includes('slug') || errorMessage.includes('accounts_slug')) {
        throw new Error('Slug already taken')
      }
    }
    logger.error('Error creating account', error as Error, { email: data.email })
    throw error
  }
}

// Update account
export async function updateAccountDB(
  accountId: string,
  updates: Partial<Pick<CompanyAccount, 'companyName' | 'website' | 'email' | 'slug'>>
): Promise<CompanyAccount> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  try {
    // Update each field individually
    if (updates.companyName) {
      await sql`UPDATE accounts SET company_name = ${updates.companyName} WHERE id = ${accountId}::uuid`
    }
    if (updates.email) {
      await sql`UPDATE accounts SET email = ${updates.email} WHERE id = ${accountId}::uuid`
    }
    if (updates.website) {
      await sql`UPDATE accounts SET website = ${updates.website} WHERE id = ${accountId}::uuid`
    }
    if (updates.slug) {
      await sql`UPDATE accounts SET slug = ${updates.slug} WHERE id = ${accountId}::uuid`
    }
    
    const account = await findAccountByIdDB(accountId)
    if (!account) {
      throw new Error('Account not found')
    }
    
    return account
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // Unique constraint violation
      const errorMessage = (error as { message?: string }).message || ''
      if (errorMessage.includes('email') || errorMessage.includes('accounts_email')) {
        throw new Error('Email already in use')
      }
      if (errorMessage.includes('slug') || errorMessage.includes('accounts_slug')) {
        throw new Error('Slug is not available')
      }
    }
    logger.error('Error updating account', error as Error, { accountId })
    throw error
  }
}

// Update account settings
export async function updateAccountSettingsDB(
  accountId: string,
  settings: Partial<CompanyAccount['settings']> & { formConfig?: import('../form-config').FormConfiguration | null | undefined }
): Promise<CompanyAccount> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  try {
    // Get current account
    const account = await findAccountByIdDB(accountId)
    if (!account) {
      throw new Error('Account not found')
    }
    
    // Merge settings
    const currentSettings = account.settings || {}
    let newSettings = { ...currentSettings }
    
    // Handle formConfig separately (can be null to remove it)
    if ('formConfig' in settings) {
      if (settings.formConfig === null || settings.formConfig === undefined) {
        delete newSettings.formConfig
      } else {
        newSettings.formConfig = settings.formConfig
      }
      // formConfig is handled separately above
    }
    
    // Merge other settings
    newSettings = { ...newSettings, ...settings }
    
    await sql`
      UPDATE accounts
      SET settings = ${JSON.stringify(newSettings)}::jsonb
      WHERE id = ${accountId}::uuid
    `
    
    const updatedAccount = await findAccountByIdDB(accountId)
    if (!updatedAccount) {
      throw new Error('Account not found')
    }
    
    return updatedAccount
  } catch (error) {
    logger.error('Error updating account settings', error as Error, { accountId })
    throw error
  }
}
