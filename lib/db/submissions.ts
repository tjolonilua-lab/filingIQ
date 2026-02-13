import { sql } from './client'
import type { IntakeSubmission } from '../validation'
import { logger } from '../logger'
import type { SubmissionRow } from '../types/db'
import { mapSubmissionRow, isSubmissionRow } from '../types/db'

/**
 * Submission database operations
 */

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
    
    const rows = result as unknown[]
    if (rows.length === 0 || typeof rows[0] !== 'object' || rows[0] === null || !('id' in rows[0])) {
      throw new Error('Failed to create submission: no ID returned')
    }
    return String((rows[0] as { id: string | number }).id)
  } catch (error) {
    logger.error('Error creating submission', error as Error, { accountId })
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
    
    const rows = result as unknown[]
    return rows
      .filter(isSubmissionRow)
      .map(mapSubmissionRow)
  } catch (error) {
    logger.error('Error fetching submissions', error as Error, { accountId })
    throw error
  }
}
