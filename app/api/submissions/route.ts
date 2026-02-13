import { NextRequest } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import type { IntakeSubmission } from '@/lib/validation'
import { getSubmissionsByAccountDB, isDatabaseAvailable } from '@/lib/db'
import { unauthorizedError, serverError, okResponse } from '@/lib/api'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    // Get account ID from header
    const accountId = request.headers.get('X-Account-Id')
    
    if (!accountId) {
      return unauthorizedError('Account ID required')
    }

    // Try database first (preferred)
    const dbAvailable = await isDatabaseAvailable()
    if (dbAvailable) {
      try {
        const submissions = await getSubmissionsByAccountDB(accountId)
        return okResponse({
          count: submissions.length,
          submissions,
        })
      } catch (error) {
        logger.error('Error fetching submissions from database', error as Error, { accountId })
        // Fall through to filesystem fallback
      }
    }

    // Fallback to filesystem (for local development or if database fails)
    const dataDir = join(process.cwd(), 'data', 'intakes')
    
    // Read all JSON files (handle case where directory doesn't exist)
    let files: string[] = []
    try {
      files = await readdir(dataDir)
    } catch (error) {
      // Directory doesn't exist (common on Vercel if no submissions yet)
      // Return empty array instead of error
      return okResponse({
        count: 0,
        submissions: [],
      })
    }
    
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    const submissions: Array<IntakeSubmission & { id: string; accountId?: string }> = []

    for (const file of jsonFiles) {
      try {
        const filePath = join(dataDir, file)
        const content = await readFile(filePath, 'utf-8')
        const submission = JSON.parse(content) as IntakeSubmission & { accountId?: string }
        
        // Filter by account ID if provided
        if (submission.accountId && submission.accountId !== accountId) {
          continue // Skip submissions from other accounts
        }
        
        // If no accountId in submission, include it (for backward compatibility with old submissions)
        submissions.push({
          ...submission,
          id: file.replace('.json', ''),
        })
      } catch (error) {
        logger.error(`Error reading file ${file}`, error as Error)
      }
    }

    // Sort by submission date (newest first)
    submissions.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )

    return okResponse({
      count: submissions.length,
      submissions,
    })
  } catch (error) {
    const errorAccountId = request.headers.get('X-Account-Id') || 'unknown'
    logger.error('Error fetching submissions', error as Error, { accountId: errorAccountId })
    return serverError('Failed to fetch submissions')
  }
}

