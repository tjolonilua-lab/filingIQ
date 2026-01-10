import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { intakeSchema, type IntakeSubmission } from '@/lib/validation'
import { storeUpload } from '@/lib/upload'
import { sendIntakeEmail } from '@/lib/email'
import { analyzeDocuments, generateAnalysisSummary } from '@/lib/ai-analysis'
import { isAIAnalysisEnabled } from '@/lib/business-config'

export async function POST(request: NextRequest) {
  try {
    // Get account ID from query params or header (for company-specific intake)
    const accountId = request.headers.get('X-Account-Id') || request.nextUrl.searchParams.get('accountId') || null
    
    const formData = await request.formData()

    // Parse JSON fields
    const contactInfo = JSON.parse(formData.get('contactInfo') as string)
    const filingInfo = JSON.parse(formData.get('filingInfo') as string)
    const incomeInfo = JSON.parse(formData.get('incomeInfo') as string)
    
    // Check business-level configuration for AI analysis
    const enableAIAnalysis = isAIAnalysisEnabled()

    // Handle file uploads
    const files = formData.getAll('files') as File[]
    const uploadedDocuments = []

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
        console.error(`Failed to upload file ${file.name}:`, error)
        return NextResponse.json(
          { success: false, message: `Failed to upload file: ${file.name}` },
          { status: 500 }
        )
      }
    }

    // Analyze documents with AI (if enabled and configured)
    let documentAnalyses: Array<{ filename: string; analysis: any; error?: string }> = []
    if (enableAIAnalysis) {
      try {
        console.log('Starting AI document analysis...')
        documentAnalyses = await analyzeDocuments(uploadedDocuments)
        
        // Attach analysis results to documents
        uploadedDocuments.forEach((doc: any, index) => {
          const analysis = documentAnalyses[index]
          if (analysis?.analysis) {
            doc.analysis = analysis.analysis
          }
        })
        
        console.log(`Completed analysis for ${documentAnalyses.filter(a => a.analysis).length} documents`)
      } catch (error) {
        console.error('Document analysis failed (continuing without analysis):', error)
        // Continue without analysis - this is optional
      }
    }

    // Build intake submission
    const intake: IntakeSubmission & { accountId?: string } = {
      contactInfo,
      filingInfo,
      incomeInfo,
      documents: uploadedDocuments,
      submittedAt: new Date().toISOString(),
      ...(accountId && { accountId }), // Include account ID if provided
    }

    // Validate with Zod
    const validationResult = intakeSchema.safeParse(intake)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Store intake data locally
    try {
      const dataDir = join(process.cwd(), 'data', 'intakes')
      await mkdir(dataDir, { recursive: true })

      const timestamp = Date.now()
      const filename = `${timestamp}-${contactInfo.fullName.replace(/[^a-zA-Z0-9]/g, '_')}.json`
      const filePath = join(dataDir, filename)

      await writeFile(filePath, JSON.stringify(intake, null, 2), 'utf-8')
    } catch (error) {
      console.error('Failed to save intake data:', error)
      // Continue even if file save fails
    }

    // Send email notification
    try {
      const fileLinks = uploadedDocuments.map((doc) => doc.urlOrPath)
      const analysisSummary = documentAnalyses.length > 0 
        ? generateAnalysisSummary(documentAnalyses)
        : null
      await sendIntakeEmail(intake, fileLinks, analysisSummary)
    } catch (error) {
      console.error('Failed to send email:', error)
      // Continue even if email fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Intake submission error:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    )
  }
}

