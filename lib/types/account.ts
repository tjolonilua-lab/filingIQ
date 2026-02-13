import type { FormConfiguration } from '../form-config'

/**
 * Account-related types
 */

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
    [key: string]: unknown
  }
}

export interface CreateAccountData {
  companyName: string
  email: string
  password: string
  website: string
  slug?: string
}

export interface UpdateAccountData {
  companyName?: string
  email?: string
  website?: string
  slug?: string
}
