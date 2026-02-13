import { sql } from './client'
import { logger } from '../logger'

/**
 * Database initialization and main exports
 * Re-exports all database functions for backward compatibility
 */

/**
 * Initialize database tables
 * 
 * Creates all required database tables and indexes. Should be called once
 * after setting up the Neon Postgres database. Safe to call multiple times
 * (uses IF NOT EXISTS).
 * 
 * @throws {Error} If database is not configured (POSTGRES_URL not set)
 * 
 * @example
 * ```typescript
 * // Call via API: GET /api/init-db
 * // Or directly:
 * await initDatabase()
 * ```
 */
export async function initDatabase(): Promise<void> {
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
    
    logger.info('Database initialized successfully')
  } catch (error) {
    logger.error('Database initialization error', error as Error)
    throw error
  }
}

// Re-export all database functions
export * from './client'
export * from './accounts'
export * from './submissions'
export * from './password-reset'
