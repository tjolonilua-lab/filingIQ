import { NextRequest } from 'next/server'
import { analyzeDocuments } from '@/lib/ai-analysis'
import { storeUpload } from '@/lib/upload'
import { handleApiError, validationError, okResponse } from '@/lib/api'
import { logger } from '@/lib/logger'
import type { DocumentWithAnalysis } from '@/lib/types/submission'

export const maxDuration = 60

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (files.length === 0) {
      return validationError('No files provided')
    }

    // Upload files first
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
        return handleApiError(error)
      }
    }

    let filingType: string | undefined
    try {
      const filingInfoStr = formData.get('filingInfo') as string | null
      if (filingInfoStr) {
        const parsed = JSON.parse(filingInfoStr) as { filingType?: string }
        if (parsed.filingType) filingType = parsed.filingType
      }
    } catch {
      // optional
    }

    const hasOpenAIKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim())
    logger.info('Analyze request', { fileCount: uploadedDocuments.length, openAIConfigured: hasOpenAIKey, filingType })
    const results = await analyzeDocuments(uploadedDocuments, filingType ? { filingType } : undefined)
    const successCount = results.filter((r) => r.analysis).length
    if (successCount === 0 && results.length > 0) {
      logger.warn('No documents analyzed successfully', { total: results.length, firstError: results[0]?.error })
    }

    return okResponse({ results })
  } catch (error) {
    logger.error('Analysis error', error as Error)
    return handleApiError(error)
  }
}

