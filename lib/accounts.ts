import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { FormConfiguration, defaultFormConfig } from './form-config'
import { logger } from './logger'
import {
  isDatabaseAvailable,
  loadAccountsFromDB,
  findAccountByEmailDB,
  findAccountByIdDB,
  findAccountBySlugDB,
  isSlugAvailableDB,
  createAccountDB,
  updateAccountDB,
  updateAccountSettingsDB,
  deleteAccountDB,
  deleteAccountByEmailDB,
  deleteAllAccountsDB,
  updatePasswordByEmailDB,
} from './db'
import type { CompanyAccount } from './types/account'

const ACCOUNTS_DIR = path.join(process.cwd(), 'data', 'accounts')
const ACCOUNTS_FILE = path.join(ACCOUNTS_DIR, 'accounts.json')

// Ensure accounts directory exists
async function ensureAccountsDir() {
  try {
    await fs.mkdir(ACCOUNTS_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

import bcrypt from 'bcryptjs'

// Secure password hashing using bcrypt
/**
 * Hash a password using bcrypt
 * 
 * Securely hashes a password using bcrypt with configurable rounds.
 * Never store plain text passwords - always use this function.
 * 
 * @param password - The plain text password to hash
 * @returns A bcrypt hash string
 * 
 * @example
 * ```typescript
 * const hash = await hashPassword('mySecurePassword123')
 * // Store hash in database, never store plain password
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  // Use 10 rounds (good balance of security and performance)
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

// Verify password against bcrypt hash
/**
 * Verify a password against a bcrypt hash
 * 
 * Compares a plain text password with a stored hash to verify authentication.
 * 
 * @param password - The plain text password to verify
 * @param hash - The bcrypt hash to compare against
 * @returns True if password matches hash, false otherwise
 * 
 * @example
 * ```typescript
 * const account = await findAccountByEmail(email)
 * if (!account) return unauthorizedError()
 * 
 * const isValid = await verifyPassword(password, account.passwordHash)
 * if (!isValid) return unauthorizedError()
 * ```
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

// Load all accounts (uses database if available, falls back to file system)
/**
 * Load all accounts
 * 
 * Loads all accounts from the database or filesystem. Uses database
 * if available, falls back to filesystem for local development.
 * 
 * @returns Array of all accounts
 * 
 * @example
 * ```typescript
 * const accounts = await loadAccounts()
 * // Process accounts...
 * ```
 */
export async function loadAccounts(): Promise<CompanyAccount[]> {
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      return await loadAccountsFromDB()
    } catch (error) {
      logger.error('Error loading from database, falling back to file system', error as Error)
    }
  }
  
  // Fallback to file system
  await ensureAccountsDir()
  try {
    const data = await fs.readFile(ACCOUNTS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // File doesn't exist, return empty array
    return []
  }
}

// Save accounts
async function saveAccounts(accounts: CompanyAccount[]): Promise<void> {
  try {
    await ensureAccountsDir()
    await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8')
  } catch (error: any) {
    // On Vercel, filesystem is read-only. This will fail in production.
    // In production, you should use a database (e.g., PostgreSQL, MongoDB) or Vercel KV
    logger.error('Failed to save accounts file', error as Error)
    if (error.code === 'EPERM' || error.code === 'EROFS') {
      throw new Error('File system is read-only. Please configure a database for production deployments.')
    }
    throw error
  }
}

// Generate a default slug from company name
function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50)
}

// Check if slug is available (uses database if available, falls back to file system)
export async function isSlugAvailable(slug: string, excludeAccountId?: string): Promise<boolean> {
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      return await isSlugAvailableDB(slug, excludeAccountId)
    } catch (error) {
      logger.error('Error checking slug in database, falling back to file system', error as Error)
    }
  }
  
  // Fallback to file system
  const accounts = await loadAccounts()
  const normalizedSlug = slug.toLowerCase().trim()
  
  // Reserved slugs
  const reserved = ['admin', 'api', 'login', 'signup', 'dashboard', 'start', 'thank-you', 'intake']
  if (reserved.includes(normalizedSlug)) {
    return false
  }
  
  // Check if slug matches pattern (alphanumeric and hyphens only)
  if (!/^[a-z0-9-]+$/.test(normalizedSlug)) {
    return false
  }
  
  // Check if slug already exists (only check accounts that have a slug)
  const existing = accounts.find(acc => 
    acc.slug && 
    acc.slug.toLowerCase() === normalizedSlug && 
    acc.id !== excludeAccountId
  )
  
  return !existing
}

// Create new account (uses database if available, falls back to file system)
/**
 * Create a new company account
 * 
 * Creates a new account with hashed password and unique slug. Uses database
 * if available, falls back to filesystem for local development.
 * 
 * @param data - Account creation data
 * @param data.companyName - The company name
 * @param data.email - Unique email address
 * @param data.password - Plain text password (will be hashed)
 * @param data.website - Company website URL
 * @param data.slug - Optional custom slug (auto-generated if not provided)
 * @returns The created account with hashed password
 * @throws {Error} If email already exists or slug is taken
 * 
 * @example
 * ```typescript
 * const account = await createAccount({
 *   companyName: 'Acme Corp',
 *   email: 'admin@acme.com',
 *   password: 'secure123',
 *   website: 'https://acme.com',
 *   slug: 'acme-corp' // optional
 * })
 * ```
 */
export async function createAccount(data: {
  companyName: string
  email: string
  password: string
  website: string
  slug?: string // Optional custom slug
}): Promise<CompanyAccount> {
  // Check if email already exists BEFORE trying to create
  // This prevents issues where account exists in filesystem but not in DB
  const existingAccount = await findAccountByEmail(data.email)
  if (existingAccount) {
    throw new Error('Email already registered')
  }

  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      // Generate or validate slug
      let slug = data.slug?.toLowerCase().trim() || generateSlug(data.companyName)
      
      // Ensure slug is unique
      let finalSlug = slug
      let counter = 1
      while (!(await isSlugAvailableDB(finalSlug))) {
        finalSlug = `${slug}-${counter}`
        counter++
      }

      const accountId = crypto.randomUUID()
      const createdAt = new Date().toISOString()
      const passwordHash = await hashPassword(data.password)
      
      return await createAccountDB({
        id: accountId,
        companyName: data.companyName,
        email: data.email,
        passwordHash: passwordHash,
        website: data.website,
        slug: finalSlug,
        createdAt,
        settings: {},
      })
    } catch (error) {
      logger.error('Error creating account in database, falling back to file system', error as Error)
      // If it's a known error (like email already exists), re-throw it
      if (error instanceof Error && (error.message.includes('Email already') || error.message.includes('Slug already'))) {
        throw error
      }
    }
  }
  
  // Fallback to file system
  const accounts = await loadAccounts()
  
  // Double-check if email already exists (shouldn't happen due to check above, but safety check)
  if (accounts.some(acc => acc.email === data.email)) {
    throw new Error('Email already registered')
  }

  // Generate or validate slug
  let slug = data.slug?.toLowerCase().trim() || generateSlug(data.companyName)
  
  // Ensure slug is unique
  let finalSlug = slug
  let counter = 1
  while (!(await isSlugAvailable(finalSlug))) {
    finalSlug = `${slug}-${counter}`
    counter++
  }

  const passwordHash = await hashPassword(data.password)
  
  const account: CompanyAccount = {
    id: crypto.randomUUID(),
    companyName: data.companyName,
    email: data.email,
    passwordHash: passwordHash,
    website: data.website,
    slug: finalSlug,
    createdAt: new Date().toISOString(),
    settings: {},
  }

  accounts.push(account)
  await saveAccounts(accounts)
  
  return account
}

// Find account by email (uses database if available, falls back to file system)
export async function findAccountByEmail(email: string): Promise<CompanyAccount | null> {
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      return await findAccountByEmailDB(email)
    } catch (error) {
      logger.error('Error finding account in database, falling back to file system', error as Error)
    }
  }
  
  // Fallback to file system
  const accounts = await loadAccounts()
  return accounts.find(acc => acc.email === email) || null
}

/**
 * Find account by ID
 * 
 * Searches for an account by its unique ID. Uses database if available,
 * falls back to filesystem for local development.
 * 
 * @param id - The account ID to search for
 * @returns The account if found, null otherwise
 * 
 * @example
 * ```typescript
 * const account = await findAccountById(accountId)
 * if (!account) {
 *   return notFoundError('Account not found')
 * }
 * ```
 */
export async function findAccountById(id: string): Promise<CompanyAccount | null> {
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      return await findAccountByIdDB(id)
    } catch (error) {
      logger.error('Error finding account in database, falling back to file system', error as Error)
    }
  }
  
  // Fallback to file system
  const accounts = await loadAccounts()
  return accounts.find(acc => acc.id === id) || null
}

/**
 * Find account by slug
 * 
 * Searches for an account by its unique slug (vanity URL identifier).
 * Uses database if available, falls back to filesystem for local development.
 * 
 * @param slug - The slug to search for (case-insensitive)
 * @returns The account if found, null otherwise
 * 
 * @example
 * ```typescript
 * const account = await findAccountBySlug('acme-corp')
 * if (!account) {
 *   return notFoundError('Company not found')
 * }
 * ```
 */
export async function findAccountBySlug(slug: string): Promise<CompanyAccount | null> {
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      return await findAccountBySlugDB(slug)
    } catch (error) {
      logger.error('Error finding account in database, falling back to file system', error as Error)
    }
  }
  
  // Fallback to file system
  const accounts = await loadAccounts()
  const normalizedSlug = slug.toLowerCase().trim()
  return accounts.find(acc => acc.slug && acc.slug.toLowerCase() === normalizedSlug) || null
}

/**
 * Update account settings
 * 
 * Updates account settings including form configuration, branding, etc.
 * Uses database if available, falls back to filesystem for local development.
 * 
 * @param accountId - The account ID to update
 * @param settings - Partial settings object to update
 * @returns The updated account
 * @throws {Error} If account is not found
 * 
 * @example
 * ```typescript
 * const account = await updateAccountSettings(accountId, {
 *   primaryColor: '#1e3a5f',
 *   formConfig: customConfig
 * })
 * ```
 */
export async function updateAccountSettings(
  accountId: string,
  settings: Partial<CompanyAccount['settings']> & { formConfig?: FormConfiguration | null | undefined }
): Promise<CompanyAccount> {
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      return await updateAccountSettingsDB(accountId, settings)
    } catch (error) {
      logger.error('Error updating account settings in database, falling back to file system', error as Error)
    }
  }
  
  // Fallback to file system
  const accounts = await loadAccounts()
  const accountIndex = accounts.findIndex(acc => acc.id === accountId)
  
  if (accountIndex === -1) {
    throw new Error('Account not found')
  }

  // If formConfig is explicitly null or undefined, remove it from settings
  if ('formConfig' in settings && (settings.formConfig === null || settings.formConfig === undefined)) {
    const updatedSettings = { ...accounts[accountIndex].settings }
    delete updatedSettings.formConfig
    accounts[accountIndex].settings = {
      ...updatedSettings,
      ...Object.fromEntries(Object.entries(settings).filter(([key]) => key !== 'formConfig')),
    }
  } else {
    accounts[accountIndex].settings = {
      ...accounts[accountIndex].settings,
      ...settings,
    }
  }

  await saveAccounts(accounts)
  return accounts[accountIndex]
}

/**
 * Update account information
 * 
 * Updates basic account information (company name, email, website, slug).
 * Uses database if available, falls back to filesystem for local development.
 * 
 * @param accountId - The account ID to update
 * @param updates - Partial account data to update
 * @returns The updated account
 * @throws {Error} If account is not found or slug is not available
 * 
 * @example
 * ```typescript
 * const account = await updateAccount(accountId, {
 *   companyName: 'New Company Name',
 *   website: 'https://newwebsite.com'
 * })
 * ```
 */
export async function updateAccount(
  accountId: string,
  updates: Partial<Pick<CompanyAccount, 'companyName' | 'website' | 'email' | 'slug'>>
): Promise<CompanyAccount> {
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      // Validate slug if being updated
      if (updates.slug) {
        const normalizedSlug = updates.slug.toLowerCase().trim()
        if (!(await isSlugAvailableDB(normalizedSlug, accountId))) {
          throw new Error('Slug is not available')
        }
        updates.slug = normalizedSlug
      }
      
      return await updateAccountDB(accountId, updates)
    } catch (error) {
      logger.error('Error updating account in database, falling back to file system', error as Error)
      // If it's a known error, re-throw it
      if (error instanceof Error && (error.message.includes('not available') || error.message.includes('already in use'))) {
        throw error
      }
    }
  }
  
  // Fallback to file system
  const accounts = await loadAccounts()
  const accountIndex = accounts.findIndex(acc => acc.id === accountId)
  
  if (accountIndex === -1) {
    throw new Error('Account not found')
  }

  if (updates.email && accounts.some((acc, idx) => acc.email === updates.email && idx !== accountIndex)) {
    throw new Error('Email already in use')
  }

  // Validate slug if being updated
  if (updates.slug) {
    const normalizedSlug = updates.slug.toLowerCase().trim()
    if (!(await isSlugAvailable(normalizedSlug, accountId))) {
      throw new Error('Slug is not available')
    }
    updates.slug = normalizedSlug
  }

  Object.assign(accounts[accountIndex], updates)
  await saveAccounts(accounts)
  return accounts[accountIndex]
}

/**
 * Get form configuration for an account
 * 
 * Retrieves the custom form configuration for an account, falling back
 * to the default configuration if none is set.
 * 
 * @param accountId - The account ID
 * @returns The form configuration (custom or default)
 * 
 * @example
 * ```typescript
 * const config = await getFormConfig(accountId)
 * // Use config.steps, config.version, etc.
 * ```
 */
export async function getFormConfig(accountId: string): Promise<FormConfiguration> {
  const account = await findAccountById(accountId)
  if (!account) {
    return defaultFormConfig
  }
  return account.settings?.formConfig || defaultFormConfig
}

/**
 * Delete account by ID
 * 
 * Deletes an account and all related data (submissions, password reset tokens).
 * Uses database if available, falls back to filesystem for local development.
 * 
 * @param accountId - The account ID to delete
 * @throws {Error} If account is not found
 * 
 * @example
 * ```typescript
 * await deleteAccount(accountId)
 * ```
 */
export async function deleteAccount(accountId: string): Promise<void> {
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      return await deleteAccountDB(accountId)
    } catch (error) {
      logger.error('Error deleting account in database, falling back to file system', error as Error)
    }
  }
  
  // Fallback to file system
  const accounts = await loadAccounts()
  const accountIndex = accounts.findIndex(acc => acc.id === accountId)
  
  if (accountIndex === -1) {
    throw new Error('Account not found')
  }
  
  accounts.splice(accountIndex, 1)
  await saveAccounts(accounts)
}

/**
 * Delete account by email
 * 
 * Deletes an account by email address. Useful for clearing test accounts.
 * Clears from both database AND filesystem to ensure complete removal.
 * 
 * @param email - The email address of the account to delete
 * @returns True if account was found and deleted, false otherwise
 * 
 * @example
 * ```typescript
 * const deleted = await deleteAccountByEmail('test@example.com')
 * ```
 */
export async function deleteAccountByEmail(email: string): Promise<boolean> {
  let deletedFromDB = false
  
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      deletedFromDB = await deleteAccountByEmailDB(email)
    } catch (error) {
      logger.error('Error deleting account by email in database', error as Error)
    }
  }
  
  // Also delete from file system (even if DB deletion succeeded)
  // This ensures complete cleanup when accounts exist in both places
  let deletedFromFS = false
  try {
    await ensureAccountsDir()
    const accounts = await loadAccounts()
    const accountIndex = accounts.findIndex(acc => acc.email.toLowerCase() === email.toLowerCase())
    
    if (accountIndex !== -1) {
      accounts.splice(accountIndex, 1)
      await saveAccounts(accounts)
      deletedFromFS = true
    }
  } catch (error) {
    logger.error('Error deleting account from file system', error as Error)
  }
  
  return deletedFromDB || deletedFromFS
}

/**
 * Delete all accounts (use with caution!)
 * 
 * Deletes all accounts from the system. This is a destructive operation
 * and should only be used for development/testing purposes.
 * Clears from both database AND filesystem to ensure complete removal.
 * 
 * @returns The number of accounts deleted
 * 
 * @example
 * ```typescript
 * const count = await deleteAllAccounts()
 * console.log(`Deleted ${count} accounts`)
 * ```
 */
export async function deleteAllAccounts(): Promise<number> {
  let dbCount = 0
  
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      dbCount = await deleteAllAccountsDB()
    } catch (error) {
      logger.error('Error deleting all accounts in database', error as Error)
    }
  }
  
  // Also clear file system (even if DB deletion succeeded)
  // This ensures complete cleanup when accounts exist in both places
  try {
    await ensureAccountsDir()
    await fs.writeFile(ACCOUNTS_FILE, '[]', 'utf-8')
  } catch (error) {
    logger.error('Error clearing accounts from file system', error as Error)
  }
  
  return dbCount
}

/**
 * Reset password for an account
 * 
 * Resets the password for an account by email. Useful for development/testing.
 * 
 * @param email - The email address of the account
 * @param newPassword - The new plain text password (will be hashed)
 * @returns True if account was found and password was reset, false otherwise
 * 
 * @example
 * ```typescript
 * const reset = await resetPassword('user@example.com', 'newpassword123')
 * ```
 */
export async function resetPassword(email: string, newPassword: string): Promise<boolean> {
  const passwordHash = await hashPassword(newPassword)
  
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      return await updatePasswordByEmailDB(email, passwordHash)
    } catch (error) {
      logger.error('Error resetting password in database, falling back to file system', error as Error)
    }
  }
  
  // Fallback to file system
  const accounts = await loadAccounts()
  const accountIndex = accounts.findIndex(acc => acc.email === email)
  
  if (accountIndex === -1) {
    return false
  }
  
  accounts[accountIndex].passwordHash = passwordHash
  await saveAccounts(accounts)
  return true
}
