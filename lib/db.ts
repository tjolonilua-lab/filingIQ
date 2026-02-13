import { neon } from '@neondatabase/serverless'
import crypto from 'crypto'

// Initialize Neon client
// Uses POSTGRES_URL environment variable (automatically set by Vercel when using Neon)
const sql = process.env.POSTGRES_URL ? neon(process.env.POSTGRES_URL) : null
import { CompanyAccount } from './accounts'
import { FormConfiguration } from './form-config'

/**
 * Database adapter for accounts using Vercel Postgres
 * Falls back to file system if database is not configured
 */

// Initialize database tables (run this once)
export async function initDatabase() {
  if (!sql) {
    throw new Error('Database not configured. Please set POSTGRES_URL environment variable.')
  }
  
  try {
    // Create accounts table
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        website VARCHAR(500) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        settings JSONB DEFAULT '{}'::jsonb
      )
    `
    
    // Create indexes for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_accounts_slug ON accounts(slug)
    `
    
    // Create submissions table
    await sql`
      CREATE TABLE IF NOT EXISTS submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
        contact_info JSONB NOT NULL,
        filing_info JSONB NOT NULL,
        income_info JSONB NOT NULL,
        documents JSONB NOT NULL,
        submitted_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Create indexes for submissions
    await sql`
      CREATE INDEX IF NOT EXISTS idx_submissions_account_id ON submissions(account_id)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC)
    `
    
    // Create password reset tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Create indexes for password reset tokens
    await sql`
      CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_reset_tokens_account_id ON password_reset_tokens(account_id)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires_at ON password_reset_tokens(expires_at)
    `
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

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
    
    return (result as any[]).map(row => ({
      id: row.id,
      companyName: row.companyName,
      email: row.email,
      passwordHash: row.passwordHash,
      website: row.website,
      slug: row.slug,
      createdAt: row.createdAt,
      settings: row.settings || {},
    })) as CompanyAccount[]
  } catch (error) {
    console.error('Error loading accounts from database:', error)
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
    
    const rows = result as any[]
    if (rows.length === 0) {
      return null
    }
    
    const row = rows[0]
    return {
      id: row.id,
      companyName: row.companyName,
      email: row.email,
      passwordHash: row.passwordHash,
      website: row.website,
      slug: row.slug,
      createdAt: row.createdAt,
      settings: row.settings || {},
    } as CompanyAccount
  } catch (error) {
    console.error('Error finding account by email:', error)
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
    
    const rows = result as any[]
    if (rows.length === 0) {
      return null
    }
    
    const row = rows[0]
    return {
      id: row.id,
      companyName: row.companyName,
      email: row.email,
      passwordHash: row.passwordHash,
      website: row.website,
      slug: row.slug,
      createdAt: row.createdAt,
      settings: row.settings || {},
    } as CompanyAccount
  } catch (error) {
    console.error('Error finding account by ID:', error)
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
    
    const rows = result as any[]
    if (rows.length === 0) {
      return null
    }
    
    const row = rows[0]
    return {
      id: row.id,
      companyName: row.companyName,
      email: row.email,
      passwordHash: row.passwordHash,
      website: row.website,
      slug: row.slug,
      createdAt: row.createdAt,
      settings: row.settings || {},
    } as CompanyAccount
  } catch (error) {
    console.error('Error finding account by slug:', error)
    throw error
  }
}

// Check if slug is available
export async function isSlugAvailableDB(slug: string, excludeAccountId?: string): Promise<boolean> {
  try {
    const normalizedSlug = slug.toLowerCase().trim()
    
    // Reserved slugs
    const reserved = ['admin', 'api', 'login', 'signup', 'dashboard', 'start', 'thank-you', 'intake']
    if (reserved.includes(normalizedSlug)) {
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
    console.error('Error checking slug availability:', error)
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
  settings?: any
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
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      if (error.constraint?.includes('email')) {
        throw new Error('Email already registered')
      }
      if (error.constraint?.includes('slug')) {
        throw new Error('Slug already taken')
      }
    }
    console.error('Error creating account:', error)
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
    const setClauses: string[] = []
    const values: any[] = []
    let paramIndex = 1
    
    if (updates.companyName) {
      setClauses.push(`company_name = $${paramIndex}`)
      values.push(updates.companyName)
      paramIndex++
    }
    
    if (updates.email) {
      setClauses.push(`email = $${paramIndex}`)
      values.push(updates.email)
      paramIndex++
    }
    
    if (updates.website) {
      setClauses.push(`website = $${paramIndex}`)
      values.push(updates.website)
      paramIndex++
    }
    
    if (updates.slug) {
      setClauses.push(`slug = $${paramIndex}`)
      values.push(updates.slug)
      paramIndex++
    }
    
    if (setClauses.length === 0) {
      // No updates, just return the account
      const account = await findAccountByIdDB(accountId)
      if (!account) {
        throw new Error('Account not found')
      }
      return account
    }
    
    // Update each field individually if needed, or use a simpler approach
    // For now, let's update fields one by one
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
  } catch (error: any) {
    if (error.code === '23505') { // Unique constraint violation
      if (error.constraint?.includes('email')) {
        throw new Error('Email already in use')
      }
      if (error.constraint?.includes('slug')) {
        throw new Error('Slug is not available')
      }
    }
    console.error('Error updating account:', error)
    throw error
  }
}

// Update account settings
export async function updateAccountSettingsDB(
  accountId: string,
  settings: Partial<CompanyAccount['settings']> & { formConfig?: FormConfiguration | null | undefined }
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
      delete (settings as any).formConfig
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
    console.error('Error updating account settings:', error)
    throw error
  }
}

// Check if database is available
export async function isDatabaseAvailable(): Promise<boolean> {
  if (!sql) {
    return false
  }
  
  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    return false
  }
}

// Submissions functions
import type { IntakeSubmission } from './validation'

export async function createSubmissionDB(
  accountId: string | null,
  submission: IntakeSubmission
): Promise<string> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  try {
    const result = await sql`
      INSERT INTO submissions (
        account_id,
        contact_info,
        filing_info,
        income_info,
        documents,
        submitted_at
      ) VALUES (
        ${accountId ? accountId : null}::uuid,
        ${JSON.stringify(submission.contactInfo)}::jsonb,
        ${JSON.stringify(submission.filingInfo)}::jsonb,
        ${JSON.stringify(submission.incomeInfo)}::jsonb,
        ${JSON.stringify(submission.documents)}::jsonb,
        ${submission.submittedAt}::timestamp
      )
      RETURNING id::text
    `
    
    const rows = result as any[]
    return rows[0].id
  } catch (error) {
    console.error('Error creating submission:', error)
    throw error
  }
}

export async function getSubmissionsByAccountDB(accountId: string): Promise<Array<IntakeSubmission & { id: string; accountId?: string }>> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  try {
    const result = await sql`
      SELECT 
        id::text,
        account_id::text as "accountId",
        contact_info as "contactInfo",
        filing_info as "filingInfo",
        income_info as "incomeInfo",
        documents,
        submitted_at::text as "submittedAt"
      FROM submissions
      WHERE account_id = ${accountId}::uuid
      ORDER BY submitted_at DESC
    `
    
    const rows = result as any[]
    return rows.map(row => ({
      id: row.id,
      accountId: row.accountId,
      contactInfo: row.contactInfo,
      filingInfo: row.filingInfo,
      incomeInfo: row.incomeInfo,
      documents: row.documents,
      submittedAt: row.submittedAt,
    })) as Array<IntakeSubmission & { id: string; accountId?: string }>
  } catch (error) {
    console.error('Error fetching submissions:', error)
    throw error
  }
}

// Password reset token functions
export async function createPasswordResetTokenDB(accountId: string): Promise<string> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  try {
    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    
    await sql`
      INSERT INTO password_reset_tokens (account_id, token, expires_at)
      VALUES (${accountId}::uuid, ${token}, ${expiresAt}::timestamp)
    `
    
    return token
  } catch (error) {
    console.error('Error creating password reset token:', error)
    throw error
  }
}

export async function validatePasswordResetTokenDB(token: string): Promise<{ accountId: string } | null> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  try {
    const result = await sql`
      SELECT account_id::text as "accountId"
      FROM password_reset_tokens
      WHERE token = ${token}
        AND expires_at > NOW()
        AND used = FALSE
      LIMIT 1
    `
    
    const rows = result as any[]
    if (rows.length === 0) {
      return null
    }
    
    return { accountId: rows[0].accountId }
  } catch (error) {
    console.error('Error validating password reset token:', error)
    throw error
  }
}

export async function markPasswordResetTokenUsedDB(token: string): Promise<void> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  try {
    await sql`
      UPDATE password_reset_tokens
      SET used = TRUE
      WHERE token = ${token}
    `
  } catch (error) {
    console.error('Error marking password reset token as used:', error)
    throw error
  }
}

export async function updateAccountPasswordDB(accountId: string, passwordHash: string): Promise<void> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  try {
    await sql`
      UPDATE accounts
      SET password_hash = ${passwordHash}
      WHERE id = ${accountId}::uuid
    `
  } catch (error) {
    console.error('Error updating account password:', error)
    throw error
  }
}
