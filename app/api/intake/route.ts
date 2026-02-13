import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { intakeSchema, type IntakeSubmission, contactInfoSchema, filingInfoSchema, incomeTypesSchema } from '@/lib/validation'
import { storeUpload } from '@/lib/upload'
import { sendIntakeEmail } from '@/lib/email'
import { analyzeDocuments, generateAnalysisSummary } from '@/lib/ai-analysis'
import { isAIAnalysisEnabled } from '@/lib/business-config'
import { createSubmissionDB, isDatabaseAvailable } from '@/lib/db'
import { handleApiError, validationError, serverError, okResponse } from '@/lib/api'
import { logger } from '@/lib/logger'
import { getAccountIdFromRequest } from '@/lib/api/auth'
import { withCorrelationId } from '@/lib/middleware/correlation'
import { findAccountById } from '@/lib/accounts'
import type { AnalysisResult, DocumentWithAnalysis } from '@/lib/types/submission'

export const POST = withCorrelationId(async (request: NextRequest, correlationId: string) => {
  try {
    // Get account ID from query params or header
    const accountId = getAccountIdFromRequest(request)
    
    const formData = await request.formData()

    // Parse and validate JSON fields with proper error handling
    let contactInfo, filingInfo, incomeInfo
    
    try {
      const contactInfoStr = formData.get('contactInfo') as string
      if (!contactInfoStr) {
        return validationError('Contact information is required')
      }
      contactInfo = JSON.parse(contactInfoStr)
      contactInfoSchema.parse(contactInfo) // Validate structure
    } catch (error) {
      logger.error('Failed to parse contact info', error as Error)
      return validationError('Invalid contact information format')
    }

    try {
      const filingInfoStr = formData.get('filingInfo') as string
      if (!filingInfoStr) {
        return validationError('Filing information is required')
      }
      filingInfo = JSON.parse(filingInfoStr)
      filingInfoSchema.parse(filingInfo) // Validate structure
    } catch (error) {
      logger.error('Failed to parse filing info', error as Error)
      return validationError('Invalid filing information format')
    }

    try {
      const incomeInfoStr = formData.get('incomeInfo') as string
      if (!incomeInfoStr) {
        return validationError('Income information is required')
      }
      incomeInfo = JSON.parse(incomeInfoStr)
      incomeTypesSchema.parse(incomeInfo) // Validate structure
    } catch (error) {
      logger.error('Failed to parse income info', error as Error)
      return validationError('Invalid income information format')
    }
    
    // Handle file uploads
    const files = formData.getAll('files') as File[]
    const uploadedDocuments: DocumentWithAnalysis[] = []

    for (const file of files) {
      try {
        const result = await storeUpload(file, file.name)
        uploadedDocuments.push({
          filename: file.name,
          urlOrPath: result.urlOrPath,
          size: file.size,
          type: file.type,
        })
      } catch (error) {
        logger.error(`Failed to upload file ${file.name}`, error as Error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return serverError(
          errorMessage.includes('S3') || errorMessage.includes('configure')
            ? errorMessage
            : `Failed to upload file: ${file.name}. ${errorMessage}`
        )
      }
    }

    // Analyze documents with AI (if enabled and configured)
    let documentAnalyses: AnalysisResult[] = []
    const enableAIAnalysis = isAIAnalysisEnabled()
    
    if (enableAIAnalysis) {
      try {
        logger.info('Starting AI document analysis', { documentCount: uploadedDocuments.length })
        documentAnalyses = await analyzeDocuments(uploadedDocuments)
        
        // Attach analysis results to documents
        uploadedDocuments.forEach((doc, index) => {
          const analysis = documentAnalyses[index]
          if (analysis?.analysis) {
            doc.analysis = analysis.analysis
          }
        })
        
        const successCount = documentAnalyses.filter(a => a.analysis).length
        logger.info(`Completed analysis for ${successCount} documents`)
      } catch (error) {
        logger.error('Document analysis failed (continuing without analysis)', error as Error)
        // Continue without analysis - this is optional
      }
    }

    // Build intake submission
    const intake: IntakeSubmission = {
      contactInfo,
      filingInfo,
      incomeInfo,
      documents: uploadedDocuments,
      submittedAt: new Date().toISOString(),
    }

    // Validate with Zod
    const validationResult = intakeSchema.safeParse(intake)
    if (!validationResult.success) {
      return validationError(
        `Validation failed: ${validationResult.error.errors.map(e => e.message).join(', ')}`
      )
    }

    // Store intake data in database (preferred) or filesystem (fallback)
    try {
      const dbAvailable = await isDatabaseAvailable()
      if (dbAvailable) {
        await createSubmissionDB(accountId || null, intake)
        logger.info('Submission saved to database', { accountId })
      } else {
        // Fallback to local filesystem (for local development)
        const dataDir = join(process.cwd(), 'data', 'intakes')
        await mkdir(dataDir, { recursive: true })

        const timestamp = Date.now()
        const filename = `${timestamp}-${contactInfo.fullName.replace(/[^a-zA-Z0-9]/g, '_')}.json`
        const filePath = join(dataDir, filename)

        await writeFile(filePath, JSON.stringify(intake, null, 2), 'utf-8')
        logger.info('Submission saved to filesystem (database not available)')
      }
    } catch (error) {
      logger.error('Failed to save intake data', error as Error)
      // Continue even if save fails - email can still be sent
    }

    // Send email notification to account owner
    try {
      // Get account email for notifications
      let accountEmail: string | undefined
      if (accountId) {
        const account = await findAccountById(accountId)
        accountEmail = account?.email
      }
      
      const fileLinks = uploadedDocuments.map((doc) => doc.urlOrPath)
      const analysisSummary = documentAnalyses.length > 0 
        ? generateAnalysisSummary(documentAnalyses)
        : null
      await sendIntakeEmail(intake, fileLinks, analysisSummary, accountEmail)
      logger.info('Intake email sent successfully', { to: accountEmail })
    } catch (error) {
      logger.error('Failed to send email', error as Error)
      // Continue even if email fails
    }

    return okResponse({}, 'Intake submission received successfully')
  } catch (error) {
    logger.error('Intake submission error', error as Error, { correlationId })
    return handleApiError(error)
  }
})

