import type { DocumentAnalysis, IntakeSubmission } from '../validation'

/**
 * Submission-related types
 */

export interface DocumentWithAnalysis {
  filename: string
  urlOrPath: string
  size: number
  type: string
  analysis?: DocumentAnalysis | null
}

export interface AnalysisResult {
  filename: string
  analysis: DocumentAnalysis | null
  error?: string
}

export interface SubmissionWithId extends IntakeSubmission {
  id: string
  accountId?: string
}
