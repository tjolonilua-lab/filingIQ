import OpenAI from 'openai'
import type { DocumentAnalysis } from '@/lib/validation'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { logger } from './logger'
import { getS3ObjectBuffer } from './upload'
import { OPENAI_DEFAULT_MODEL, OPENAI_MAX_TOKENS, OPENAI_TEMPERATURE } from './constants'

// DocumentAnalysis type is imported from validation

import type { AnalysisResult } from './types/submission'

/** Ensure DOMMatrix is defined for pdfjs in Node/serverless (pdfjs uses it even for text extraction) */
function ensureDOMMatrixPolyfill(): void {
  if (typeof globalThis.DOMMatrix !== 'undefined') return
  try {
    const dm = require('dommatrix')
    globalThis.DOMMatrix = dm.default ?? dm
  } catch {
    // optional
  }
}

/**
 * Load pdfjs worker so fake-worker setup finds it (avoids "Cannot find module pdf.worker.mjs" in serverless).
 * Must run before getDocument. The worker module sets globalThis.pdfjsWorker when loaded.
 */
async function ensurePdfjsWorkerLoaded(): Promise<void> {
  const g = globalThis as { pdfjsWorker?: unknown }
  if (g.pdfjsWorker != null) return
  try {
    await import('pdfjs-dist/legacy/build/pdf.worker.mjs')
  } catch {
    // Worker may already be set by another path; continue
  }
}

/**
 * Extract text from the first page of a PDF buffer using pdfjs (no canvas/rendering).
 * Avoids "path" errors from pdf-to-img in serverless.
 */
async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  ensureDOMMatrixPolyfill()
  await ensurePdfjsWorkerLoaded()
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const data = new Uint8Array(buffer)
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise
  const page = await doc.getPage(1)
  const content = await page.getTextContent()
  const text = (content.items as { str?: string }[])
    .map((item) => item.str ?? '')
    .join(' ')
  return text.trim() || '(No text extracted from PDF)'
}

/**
 * Get OpenAI client at request time (so Vercel runtime env is used)
 */
function getOpenAIClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY
  if (!key || key.trim() === '') return null
  return new OpenAI({ apiKey: key })
}

/**
 * Analyzes a tax document from base64 buffer using OpenAI Vision API
 */
async function analyzeDocumentFromBuffer(
  base64Image: string,
  filename: string,
  imageFormat: 'png' | 'jpeg'
): Promise<DocumentAnalysis | null> {
  const openai = getOpenAIClient()
  if (!openai) {
    logger.warn('OpenAI API key not configured, skipping document analysis')
    return null
  }

  try {
    const mimeType = imageFormat === 'png' ? 'image/png' : 'image/jpeg'

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || OPENAI_DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: TAX_ANALYSIS_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: OPENAI_MAX_TOKENS,
      temperature: OPENAI_TEMPERATURE, // Low temperature for more consistent extraction
    })

    const analysisText = response.choices[0]?.message?.content
    if (!analysisText) {
      logger.error('No analysis returned from OpenAI', undefined, { filename })
      return null
    }

    // Parse the analysis (OpenAI returns JSON-like structure in text)
    // We'll try to extract structured data from the response
    return parseAnalysisResponse(analysisText, filename)
  } catch (error) {
    logger.error(`Error analyzing document ${filename}`, error as Error)
    // Rethrow so caller can show the real error (e.g. 429 quota, invalid key)
    throw error
  }
}

const TAX_ANALYSIS_PROMPT = `Analyze this tax document and extract key information to identify tax optimization strategies.

Extract:
1. Document type (W-2, 1099-NEC, 1099-K, 1099-INT, 1099-DIV, Schedule C, etc.)
2. Tax year
3. All monetary amounts with clear labels (e.g. "Wages, tips, other compensation", "Federal income tax withheld", "Social security tax withheld", "Medicare tax withheld", "State wages", "State income tax withheld")
4. Employer/payer name
5. Recipient/taxpayer name and SSN (mask SSN for privacy, show last 4 digits only)
6. Important dates
7. Any other relevant tax information

Then identify potential tax strategies based on the data:
- Retirement contribution opportunities (401k, IRA, SEP-IRA, etc.)
- Deduction maximization strategies
- Income timing opportunities
- Tax-advantaged investment strategies
- Business expense optimization
- Estimated tax planning
- Any other tax-saving opportunities typically used by high-net-worth individuals

Return a structured analysis (JSON when possible) with:
- documentType and confidence
- extractedData including year and amounts (each amount with label and value; use descriptive labels like "Wages, tips, other compensation", not "Amount")
- summary: 2–4 sentences that explicitly state the tax year and the main monetary figures (e.g. wages, federal tax withheld, Social Security withheld). Lead with the document type and tax year, then highlight key dollar amounts.
- notes: 2–5 actionable strategy bullets based on this document. Each note should be one clear sentence (e.g. "Maximize 401(k) contributions to reduce taxable wages." or "Review estimated tax payments to avoid underpayment penalties."). Do not include a generic "may need manual review" note unless you have no specific strategies to suggest.

Focus on strategies that can meaningfully reduce tax liability. Be specific about dollar amounts and potential savings where possible.`

/**
 * Analyze a document from extracted text (used for PDFs to avoid image conversion).
 */
async function analyzeDocumentFromText(extractedText: string, filename: string): Promise<DocumentAnalysis | null> {
  const openai = getOpenAIClient()
  if (!openai) return null
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || OPENAI_DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: `${TAX_ANALYSIS_PROMPT}\n\n---\nExtracted text from "${filename}":\n\n${extractedText}`,
        },
      ],
      max_tokens: OPENAI_MAX_TOKENS,
      temperature: OPENAI_TEMPERATURE,
    })
    const analysisText = response.choices[0]?.message?.content
    if (!analysisText) return null
    return parseAnalysisResponse(analysisText, filename)
  } catch (error) {
    logger.error(`Error analyzing document from text ${filename}`, error as Error)
    throw error
  }
}

/**
 * Analyzes a tax document using OpenAI Vision API (from file path)
 */
export async function analyzeDocument(
  filePath: string,
  filename: string,
  mimeType: string
): Promise<DocumentAnalysis | null> {
  try {
    const buffer = await readFile(filePath)
    let base64Image: string
    let imageFormat: 'png' | 'jpeg'

    if (mimeType === 'application/pdf') {
      const extractedText = await extractTextFromPdfBuffer(buffer)
      return await analyzeDocumentFromText(extractedText, filename)
    }
    base64Image = buffer.toString('base64')
    imageFormat = mimeType.includes('png') ? 'png' : 'jpeg'
    return await analyzeDocumentFromBuffer(base64Image, filename, imageFormat)
  } catch (error) {
    logger.error(`Error reading file ${filename}`, error as Error)
    return null
  }
}

/**
 * Parses OpenAI's text response into structured DocumentAnalysis
 */
function parseAnalysisResponse(
  responseText: string,
  _filename: string
): DocumentAnalysis {
  // Try to extract JSON from the response
  let parsed: any = null

  // Look for JSON code blocks
  const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[1])
    } catch (e) {
      // Fall through to text parsing
    }
  }

  // If no JSON found, try to parse the entire response as JSON
  if (!parsed) {
    try {
      parsed = JSON.parse(responseText)
    } catch (e) {
      // Fall through to text parsing
    }
  }

  // If we have structured data, use it
  if (parsed && typeof parsed === 'object') {
    return {
      documentType: parsed.documentType || 'Unknown',
      confidence: parsed.confidence || 'medium',
      extractedData: parsed.extractedData || {},
      summary: parsed.summary || responseText.substring(0, 200),
      notes: parsed.notes || [],
    }
  }

  // Fallback: extract information from text using regex patterns
  const documentTypeMatch = responseText.match(/document type[:\s]+([A-Z0-9-]+)/i)
  const docType = (documentTypeMatch?.[1] || 'Unknown').toUpperCase()
  const yearMatch = responseText.match(/(?:tax year|year)[:\s]+(\d{4})/i)
  const amountMatches = responseText.match(/\$?([\d,]+\.?\d*)/g)

  const amounts = amountMatches
    ? amountMatches
        .map((match) => {
          const value = parseFloat(match.replace(/[$,]/g, ''))
          return isNaN(value) ? null : { label: 'Amount', value }
        })
        .filter((a): a is { label: string; value: number } => a !== null)
    : []

  const fallbackNotes: string[] = []
  if (docType.includes('W-2')) {
    fallbackNotes.push('Consider maximizing 401(k) or IRA contributions to reduce taxable wages.')
    fallbackNotes.push('Review withholding to avoid underpayment or overpayment for the year.')
  }
  if (docType.includes('1099')) {
    fallbackNotes.push('Set aside estimated taxes on self-employment or freelance income.')
    fallbackNotes.push('Explore retirement plans for self-employed individuals (e.g. SEP-IRA, Solo 401k).')
  }
  fallbackNotes.push('A tax professional can provide personalized strategy based on your full situation.')

  const yearStr = yearMatch?.[1] || 'not specified'
  const topAmounts = amounts.length > 0
    ? amounts
        .sort((a, b) => b.value - a.value)
        .slice(0, 4)
        .map((a) => `$${a.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`)
        .join(', ')
    : ''
  const summaryFallback =
    responseText.substring(0, 400).trim() ||
    `Document identified as ${docType}. **Tax year: ${yearStr}.**${topAmounts ? ` Key amounts extracted: ${topAmounts}.` : ' Key amounts extracted for review.'}`

  return {
    documentType: documentTypeMatch?.[1] || 'Unknown',
    confidence: 'low',
    extractedData: {
      year: yearMatch?.[1],
      amounts: amounts.length > 0 ? amounts : undefined,
    },
    summary: summaryFallback,
    notes: fallbackNotes,
  }
}

/**
 * Analyzes multiple tax documents using OpenAI Vision API
 * 
 * Processes multiple documents, downloading from S3 if needed, and analyzes
 * each one to extract tax information and identify optimization strategies.
 * 
 * @param documents - Array of document objects with filename, urlOrPath, and type
 * @returns Array of analysis results, one per document
 * 
 * @example
 * ```typescript
 * const results = await analyzeDocuments([
 *   { filename: 'w2.pdf', urlOrPath: 'https://s3.../w2.pdf', type: 'application/pdf' }
 * ])
 * ```
 */
export async function analyzeDocuments(
  documents: Array<{ filename: string; urlOrPath: string; type: string }>
): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = []

  for (const doc of documents) {
    try {
      let fileBuffer: Buffer
      let mimeType = doc.type
      
      if (doc.urlOrPath.startsWith('http')) {
        // S3 URL: use AWS credentials to download (bucket is private; fetch() would get 403)
        const isS3Url = doc.urlOrPath.includes('.s3.') && doc.urlOrPath.includes('amazonaws.com')
        try {
          if (isS3Url) {
            const { buffer, contentType } = await getS3ObjectBuffer(doc.urlOrPath)
            fileBuffer = buffer
            if (contentType) mimeType = contentType
          } else {
            const response = await fetch(doc.urlOrPath)
            if (!response.ok) {
              throw new Error(`Failed to download file: ${response.statusText}`)
            }
            const arrayBuffer = await response.arrayBuffer()
            fileBuffer = Buffer.from(arrayBuffer)
            const contentType = response.headers.get('content-type')
            if (contentType) mimeType = contentType
          }
        } catch (error) {
          results.push({
            filename: doc.filename,
            analysis: null,
            error: `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          })
          continue
        }
      } else {
        // Local file path
        const filePath = join(process.cwd(), doc.urlOrPath.replace(/^\/uploads\//, 'uploads/'))
        fileBuffer = await readFile(filePath)
      }

      // PDF: extract text and analyze with chat (no image conversion; avoids path/canvas errors in serverless)
      if (mimeType === 'application/pdf') {
        try {
          const extractedText = await extractTextFromPdfBuffer(fileBuffer)
          const analysis = await analyzeDocumentFromText(extractedText, doc.filename)
          results.push({
            filename: doc.filename,
            analysis,
            ...(analysis === null && {
              error: 'AI analysis skipped (OpenAI not configured). Set OPENAI_API_KEY in Vercel for Production and Preview and redeploy.',
            }),
          })
        } catch (pdfError) {
          logger.error('PDF analysis failed', pdfError as Error, { filename: doc.filename })
          results.push({
            filename: doc.filename,
            analysis: null,
            error: `Could not analyze PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`,
          })
        }
        continue
      }

      // Convert buffer to base64 for OpenAI Vision (images only)
      const base64Image = fileBuffer.toString('base64')
      const imageFormat: 'png' | 'jpeg' = mimeType.includes('png') ? 'png' : 'jpeg'

      // Analyze the document using base64 data
      const analysis = await analyzeDocumentFromBuffer(base64Image, doc.filename, imageFormat)
      results.push({
        filename: doc.filename,
        analysis,
        ...(analysis === null && {
          error: 'AI analysis skipped (OpenAI not configured). Set OPENAI_API_KEY in Vercel for Production and Preview and redeploy.',
        }),
      })
    } catch (error) {
      results.push({
        filename: doc.filename,
        analysis: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}

/**
 * Generate a summary of all document analyses
 * 
 * Creates a human-readable summary of multiple document analyses,
 * highlighting key findings and document types.
 * 
 * @param analyses - Array of analysis results
 * @returns A formatted summary string
 * 
 * @example
 * ```typescript
 * const summary = generateAnalysisSummary(analysisResults)
 * await sendIntakeEmail(intake, fileLinks, summary)
 * ```
 */
export function generateAnalysisSummary(analyses: AnalysisResult[]): string {
  const successful = analyses.filter((a) => a.analysis)
  if (successful.length === 0) {
    return 'No documents were successfully analyzed.'
  }

  const summaryParts: string[] = []
  summaryParts.push(`Analyzed ${successful.length} of ${analyses.length} document(s):\n`)

  successful.forEach((result) => {
    if (result.analysis) {
      summaryParts.push(`\n📄 ${result.filename}`)
      summaryParts.push(`   Type: ${result.analysis.documentType} (${result.analysis.confidence} confidence)`)
      if (result.analysis.extractedData.year) {
        summaryParts.push(`   Year: ${result.analysis.extractedData.year}`)
      }
      if (result.analysis.extractedData.amounts && result.analysis.extractedData.amounts.length > 0) {
        const total = result.analysis.extractedData.amounts.reduce((sum, a) => sum + a.value, 0)
        summaryParts.push(`   Total Amounts: $${total.toLocaleString()}`)
      }
      summaryParts.push(`   Summary: ${result.analysis.summary.substring(0, 100)}...`)
    }
  })

  return summaryParts.join('\n')
}

