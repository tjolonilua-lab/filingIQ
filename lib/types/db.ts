/**
 * Database row type definitions
 * Used for type-safe database query results
 */

import type { CompanyAccount } from './account'
import type { IntakeSubmission } from '../validation'

/**
 * Raw database row for accounts table
 */
export interface AccountRow {
  id: string
  companyName: string
  email: string
  passwordHash: string
  website: string
  slug: string
  createdAt: string
  settings: Record<string, unknown> | null
}

/**
 * Raw database row for submissions table
 */
export interface SubmissionRow {
  id: string
  accountId: string | null
  contactInfo: unknown
  filingInfo: unknown
  incomeInfo: unknown
  documents: unknown
  submittedAt: string
}

/**
 * Type guard for account rows
 */
export function isAccountRow(row: unknown): row is AccountRow {
  return (
    typeof row === 'object' &&
    row !== null &&
    'id' in row &&
    'companyName' in row &&
    'email' in row
  )
}

/**
 * Type guard for submission rows
 */
export function isSubmissionRow(row: unknown): row is SubmissionRow {
  return (
    typeof row === 'object' &&
    row !== null &&
    'id' in row &&
    'contactInfo' in row
  )
}

/**
 * Convert account row to CompanyAccount
 */
export function mapAccountRow(row: AccountRow): CompanyAccount {
  return {
    id: row.id,
    companyName: row.companyName,
    email: row.email,
    passwordHash: row.passwordHash,
    website: row.website,
    slug: row.slug,
    createdAt: row.createdAt,
    settings: row.settings || {},
  }
}

/**
 * Convert submission row to IntakeSubmission with ID
 */
export function mapSubmissionRow(row: SubmissionRow): IntakeSubmission & { id: string; accountId?: string } {
  return {
    id: row.id,
    accountId: row.accountId || undefined,
    contactInfo: row.contactInfo as IntakeSubmission['contactInfo'],
    filingInfo: row.filingInfo as IntakeSubmission['filingInfo'],
    incomeInfo: row.incomeInfo as IntakeSubmission['incomeInfo'],
    documents: row.documents as IntakeSubmission['documents'],
    submittedAt: row.submittedAt,
  }
}
