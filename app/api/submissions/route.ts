import { NextRequest, NextResponse } from 'next/server'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import type { IntakeSubmission } from '@/lib/validation'

// Simple password-based auth (in production, use proper auth)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  
  const token = authHeader.replace('Bearer ', '')
  return token === ADMIN_PASSWORD
}

export async function GET(request: NextRequest) {
  try {
    // Get account ID from header
    const accountId = request.headers.get('X-Account-Id')
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID required' },
        { status: 401 }
      )
    }

    const dataDir = join(process.cwd(), 'data', 'intakes')
    
    // Read all JSON files (handle case where directory doesn't exist)
    let files: string[] = []
    try {
      files = await readdir(dataDir)
    } catch (error) {
      // Directory doesn't exist (common on Vercel if no submissions yet)
      // Return empty array instead of error
      return NextResponse.json({
        success: true,
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
        console.error(`Error reading file ${file}:`, error)
      }
    }

    // Sort by submission date (newest first)
    submissions.sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )

    return NextResponse.json({
      success: true,
      count: submissions.length,
      submissions,
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

