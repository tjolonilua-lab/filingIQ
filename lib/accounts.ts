import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { FormConfiguration, defaultFormConfig } from './form-config'

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

// Load all accounts
export async function loadAccounts(): Promise<CompanyAccount[]> {
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

// Check if slug is available
export async function isSlugAvailable(slug: string, excludeAccountId?: string): Promise<boolean> {
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

// Create new account
export async function createAccount(data: {
  companyName: string
  email: string
  password: string
  website: string
  slug?: string // Optional custom slug
}): Promise<CompanyAccount> {
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

// Find account by email
export async function findAccountByEmail(email: string): Promise<CompanyAccount | null> {
  const accounts = await loadAccounts()
  return accounts.find(acc => acc.email === email) || null
}

// Find account by ID
export async function findAccountById(id: string): Promise<CompanyAccount | null> {
  const accounts = await loadAccounts()
  return accounts.find(acc => acc.id === id) || null
}

// Find account by slug
export async function findAccountBySlug(slug: string): Promise<CompanyAccount | null> {
  const accounts = await loadAccounts()
  const normalizedSlug = slug.toLowerCase().trim()
  return accounts.find(acc => acc.slug && acc.slug.toLowerCase() === normalizedSlug) || null
}

// Update account settings
export async function updateAccountSettings(
  accountId: string,
  settings: Partial<CompanyAccount['settings']> & { formConfig?: FormConfiguration | null | undefined }
): Promise<CompanyAccount> {
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

// Update account (for company name, website, email, slug, etc.)
export async function updateAccount(
  accountId: string,
  updates: Partial<Pick<CompanyAccount, 'companyName' | 'website' | 'email' | 'slug'>>
): Promise<CompanyAccount> {
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

