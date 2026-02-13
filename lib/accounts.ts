import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { FormConfiguration, defaultFormConfig } from './form-config'
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
} from './db'

export interface CompanyAccount {
  id: string
  companyName: string
  email: string
  passwordHash: string // bcrypt hash
  website: string
  slug: string // Vanity URL slug (e.g., "flo-financial")
  createdAt: string
  settings?: {
    phone?: string
    mainWebsiteUrl?: string
    primaryColor?: string
    accentColor?: string
    formConfig?: FormConfiguration // Custom form configuration
  }
}

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

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + process.env.PASSWORD_SALT || 'default-salt').digest('hex')
}

// Verify password
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// Load all accounts (uses database if available, falls back to file system)
export async function loadAccounts(): Promise<CompanyAccount[]> {
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      return await loadAccountsFromDB()
    } catch (error) {
      console.error('Error loading from database, falling back to file system:', error)
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
    console.error('Failed to save accounts file:', error)
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
      console.error('Error checking slug in database, falling back to file system:', error)
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
export async function createAccount(data: {
  companyName: string
  email: string
  password: string
  website: string
  slug?: string // Optional custom slug
}): Promise<CompanyAccount> {
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
      
      return await createAccountDB({
        id: accountId,
        companyName: data.companyName,
        email: data.email,
        passwordHash: hashPassword(data.password),
        website: data.website,
        slug: finalSlug,
        createdAt,
        settings: {},
      })
    } catch (error) {
      console.error('Error creating account in database, falling back to file system:', error)
      // If it's a known error (like email already exists), re-throw it
      if (error instanceof Error && (error.message.includes('Email already') || error.message.includes('Slug already'))) {
        throw error
      }
    }
  }
  
  // Fallback to file system
  const accounts = await loadAccounts()
  
  // Check if email already exists
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

  const account: CompanyAccount = {
    id: crypto.randomUUID(),
    companyName: data.companyName,
    email: data.email,
    passwordHash: hashPassword(data.password),
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
      console.error('Error finding account in database, falling back to file system:', error)
    }
  }
  
  // Fallback to file system
  const accounts = await loadAccounts()
  return accounts.find(acc => acc.email === email) || null
}

// Find account by ID (uses database if available, falls back to file system)
export async function findAccountById(id: string): Promise<CompanyAccount | null> {
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      return await findAccountByIdDB(id)
    } catch (error) {
      console.error('Error finding account in database, falling back to file system:', error)
    }
  }
  
  // Fallback to file system
  const accounts = await loadAccounts()
  return accounts.find(acc => acc.id === id) || null
}

// Find account by slug (uses database if available, falls back to file system)
export async function findAccountBySlug(slug: string): Promise<CompanyAccount | null> {
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      return await findAccountBySlugDB(slug)
    } catch (error) {
      console.error('Error finding account in database, falling back to file system:', error)
    }
  }
  
  // Fallback to file system
  const accounts = await loadAccounts()
  const normalizedSlug = slug.toLowerCase().trim()
  return accounts.find(acc => acc.slug && acc.slug.toLowerCase() === normalizedSlug) || null
}

// Update account settings (uses database if available, falls back to file system)
export async function updateAccountSettings(
  accountId: string,
  settings: Partial<CompanyAccount['settings']> & { formConfig?: FormConfiguration | null | undefined }
): Promise<CompanyAccount> {
  // Try database first
  if (await isDatabaseAvailable()) {
    try {
      return await updateAccountSettingsDB(accountId, settings)
    } catch (error) {
      console.error('Error updating account settings in database, falling back to file system:', error)
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

// Update account (uses database if available, falls back to file system)
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
      console.error('Error updating account in database, falling back to file system:', error)
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

// Get form configuration for an account (with default fallback)
export async function getFormConfig(accountId: string): Promise<FormConfiguration> {
  const account = await findAccountById(accountId)
  if (!account) {
    return defaultFormConfig
  }
  return account.settings?.formConfig || defaultFormConfig
}

