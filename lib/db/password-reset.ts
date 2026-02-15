import { sql } from './client'
import crypto from 'crypto'
import { PASSWORD_RESET_TOKEN_EXPIRY_MS } from '../constants'
import { logger } from '../logger'

/**
 * Password reset token database operations
 */

export async function createPasswordResetTokenDB(accountId: string): Promise<string> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  try {
    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_MS)
    
    await sql`
      INSERT INTO password_reset_tokens (account_id, token, expires_at)
      VALUES (${accountId}::uuid, ${token}, ${expiresAt}::timestamp)
    `
    
    return token
  } catch (error) {
    logger.error('Error creating password reset token', error as Error, { accountId })
    throw error
  }
}

export async function validatePasswordResetTokenDB(token: string): Promise<{ accountId: string } | null> {
  if (!sql) {
    throw new Error('Database not configured')
  }
  
  // Validate input
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return null
  }
  
  try {
    const result = await sql`
      SELECT account_id::text as "accountId"
      FROM password_reset_tokens
      WHERE token = ${token.trim()}
        AND expires_at > NOW()
        AND used = FALSE
      LIMIT 1
    `
    
    const rows = result as unknown[]
    if (rows.length === 0 || typeof rows[0] !== 'object' || rows[0] === null || !('accountId' in rows[0])) {
      return null
    }
    
    const accountId = String((rows[0] as { accountId: string | number }).accountId)
    
    // Validate accountId is not empty
    if (!accountId || accountId.trim().length === 0) {
      logger.warn('Password reset token has invalid account ID', { token: token.substring(0, 8) + '...' })
      return null
    }
    
    return { accountId }
  } catch (error) {
    logger.error('Error validating password reset token', error as Error)
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
    logger.error('Error marking password reset token as used', error as Error)
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
    logger.error('Error updating account password', error as Error, { accountId })
    throw error
  }
}
