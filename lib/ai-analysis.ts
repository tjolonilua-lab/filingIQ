import OpenAI from 'openai'
import type { DocumentAnalysis } from '@/lib/validation'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { logger } from './logger'
import { getS3ObjectBuffer } from './upload'
import {
  OPENAI_DEFAULT_MODEL,
  OPENAI_MAX_TOKENS,
  OPENAI_TEMPERATURE,
  MAX_EXTRACTED_TEXT_CHARS,
  ANALYSIS_CONCURRENCY,
} from './constants'

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

const PDF_MAX_PAGES_TO_EXTRACT = 10

/**
 * Extract text from a PDF buffer using pdfjs (no canvas/rendering).
 * Reads up to PDF_MAX_PAGES_TO_EXTRACT pages so multi-page forms (e.g. 1098, W-2 copy 2) are fully captured.
 */
async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  ensureDOMMatrixPolyfill()
  await ensurePdfjsWorkerLoaded()
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const data = new Uint8Array(buffer)
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise
  const numPages = Math.min(doc.numPages, PDF_MAX_PAGES_TO_EXTRACT)
  const parts: string[] = []
  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = (content.items as { str?: string }[])
      .map((item) => item.str ?? '')
      .join(' ')
    if (text.trim()) parts.push(numPages > 1 ? `[Page ${i}]\n${text.trim()}` : text.trim())
  }
  const raw = parts.length > 0 ? parts.join('\n\n') : '(No text extracted from PDF)'
  return compressExtractedText(raw)
}

/**
 * Reduce token use: drop consecutive duplicate lines (common in form PDFs), normalize whitespace, cap length.
 */
function compressExtractedText(text: string): string {
  const lines = text.split(/\n/)
  const deduped: string[] = []
  let prev = ''
  for (const line of lines) {
    const t = line.trim()
    if (t && t !== prev) {
      deduped.push(t)
      prev = t
    }
  }
  const joined = deduped.join('\n').replace(/\s+/g, ' ').trim()
  if (joined.length <= MAX_EXTRACTED_TEXT_CHARS) return joined
  return joined.slice(0, MAX_EXTRACTED_TEXT_CHARS) + ' [... truncated]'
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
4. For W-2s: Box 12 codes and amounts (e.g. Code D = 401(k) deferral, Code AA = 401(k) elective deferral, Code DD = 401(k) catch-up). Include these in extractedData.amounts with labels like "Box 12 Code D - 401(k) deferral" so strategies reference actual contribution data.
5. Employer/payer name
6. Recipient/taxpayer name and SSN (mask SSN for privacy, show last 4 digits only)
7. Important dates
8. Any other relevant tax information

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

Focus on strategies that can meaningfully reduce tax liability. Be specific about dollar amounts and potential savings where possible. Keep summary and notes concise to minimize tokens.`

/**
 * Analyze a document from extracted text (used for PDFs to avoid image conversion).
 * @param intakeContext - Optional filing context (e.g. "Married Filing Separately") so the model can tailor strategies.
 */
async function analyzeDocumentFromText(
  extractedText: string,
  filename: string,
  intakeContext?: string
): Promise<DocumentAnalysis | null> {
  const openai = getOpenAIClient()
  if (!openai) return null
  const contextBlock = intakeContext
    ? `\n\nFiling context: The taxpayer is filing as "${intakeContext}". Tailor strategies and notes for this status (e.g. for Married Filing Separately: IRA deduction limits, phase-outs, and state-specific considerations).`
    : ''
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || OPENAI_DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: `${TAX_ANALYSIS_PROMPT}${contextBlock}\n\n---\nExtracted text from "${filename}":\n\n${extractedText}`,
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

const MAX_IMAGE_SIZE_FOR_ANALYSIS = 8 * 1024 * 1024 // 8MB

export type AnalyzeDocumentsOptions = {
  /** Filing status (e.g. "Married Filing Separately") so the model can tailor strategies. */
  filingType?: string
}

/**
 * Process a single document: fetch buffer, then analyze (PDF text or image Vision).
 */
async function processOneDocument(
  doc: { filename: string; urlOrPath: string; type: string },
  options?: AnalyzeDocumentsOptions
): Promise<AnalysisResult> {
  try {
    let fileBuffer: Buffer
    let mimeType = doc.type

    if (doc.urlOrPath.startsWith('http')) {
      const isS3Url = doc.urlOrPath.includes('.s3.') && doc.urlOrPath.includes('amazonaws.com')
      if (isS3Url) {
        const { buffer, contentType } = await getS3ObjectBuffer(doc.urlOrPath)
        fileBuffer = buffer
        if (contentType) mimeType = contentType
      } else {
        const response = await fetch(doc.urlOrPath)
        if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`)
        const arrayBuffer = await response.arrayBuffer()
        fileBuffer = Buffer.from(arrayBuffer)
        const ct = response.headers.get('content-type')
        if (ct) mimeType = ct
      }
    } else {
      const filePath = join(process.cwd(), doc.urlOrPath.replace(/^\/uploads\//, 'uploads/'))
      fileBuffer = await readFile(filePath)
    }

    const intakeContext = options?.filingType ?? undefined

    if (mimeType === 'application/pdf') {
      const extractedText = await extractTextFromPdfBuffer(fileBuffer)
      const analysis = await analyzeDocumentFromText(extractedText, doc.filename, intakeContext)
      return {
        filename: doc.filename,
        analysis,
        ...(analysis === null && {
          error: 'AI analysis skipped (OpenAI not configured). Set OPENAI_API_KEY in Vercel for Production and Preview and redeploy.',
        }),
      }
    }

    if (fileBuffer.length > MAX_IMAGE_SIZE_FOR_ANALYSIS) {
      return {
        filename: doc.filename,
        analysis: null,
        error: 'Image is too large for AI analysis (max 8MB). Please compress or use a smaller file.',
      }
    }

    const base64Image = fileBuffer.toString('base64')
    const imageFormat: 'png' | 'jpeg' = mimeType.includes('png') ? 'png' : 'jpeg'
    const analysis = await analyzeDocumentFromBuffer(base64Image, doc.filename, imageFormat)
    return {
      filename: doc.filename,
      analysis,
      ...(analysis === null && {
        error: 'AI analysis skipped (OpenAI not configured). Set OPENAI_API_KEY in Vercel for Production and Preview and redeploy.',
      }),
    }
  } catch (error) {
    logger.error('Document analysis failed', error as Error, { filename: doc.filename })
    return {
      filename: doc.filename,
      analysis: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Analyzes multiple tax documents using OpenAI Vision API
 *
 * Processes documents in parallel (up to ANALYSIS_CONCURRENCY at a time) to avoid timeouts with many files.
 * Pass filingType (e.g. "Married Filing Separately") so strategies are tailored to the taxpayer's status.
 *
 * @param documents - Array of document objects with filename, urlOrPath, and type
 * @param options - Optional filing context (filingType) for strategy tailoring
 * @returns Array of analysis results, one per document (order preserved)
 */
export async function analyzeDocuments(
  documents: Array<{ filename: string; urlOrPath: string; type: string }>,
  options?: AnalyzeDocumentsOptions
): Promise<AnalysisResult[]> {
  if (documents.length === 0) return []

  const results: AnalysisResult[] = []
  for (let i = 0; i < documents.length; i += ANALYSIS_CONCURRENCY) {
    const chunk = documents.slice(i, i + ANALYSIS_CONCURRENCY)
    const chunkResults = await Promise.all(chunk.map((doc) => processOneDocument(doc, options)))
    results.push(...chunkResults)
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

