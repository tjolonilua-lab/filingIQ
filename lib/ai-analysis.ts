import OpenAI from 'openai'
import type { DocumentAnalysis } from '@/lib/validation'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { logger } from './logger'
import { getS3ObjectBuffer } from './upload'
import { OPENAI_DEFAULT_MODEL, OPENAI_MAX_TOKENS, OPENAI_TEMPERATURE } from './constants'

// DocumentAnalysis type is imported from validation

import type { AnalysisResult } from './types/submission'

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
  imageFormat: 'png' | 'jpeg' | 'pdf'
): Promise<DocumentAnalysis | null> {
  const openai = getOpenAIClient()
  if (!openai) {
    logger.warn('OpenAI API key not configured, skipping document analysis')
    return null
  }

  try {
    const mimeType = imageFormat === 'pdf' ? 'application/pdf' : imageFormat === 'png' ? 'image/png' : 'image/jpeg'

    // Prepare the prompt for tax document analysis with strategy focus
    const prompt = `Analyze this tax document and extract key information to identify tax optimization strategies.

Extract:
1. Document type (W-2, 1099-NEC, 1099-K, 1099-INT, 1099-DIV, Schedule C, etc.)
2. Tax year
3. All monetary amounts (wages, income, deductions, taxes withheld, etc.)
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

Return a structured analysis with:
- Document type with confidence level
- Extracted data organized by category
- Identified tax strategy opportunities with brief explanations
- A summary highlighting the most impactful strategies
- Actionable recommendations

Focus on strategies that can meaningfully reduce tax liability. Be specific about dollar amounts and potential savings where possible.`

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || OPENAI_DEFAULT_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
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
    return null
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
    // Read file and convert to base64
    let base64Image: string
    let imageFormat: 'png' | 'jpeg' | 'pdf'

    if (mimeType === 'application/pdf') {
      const buffer = await readFile(filePath)
      base64Image = buffer.toString('base64')
      imageFormat = 'pdf'
    } else {
      const buffer = await readFile(filePath)
      base64Image = buffer.toString('base64')
      imageFormat = mimeType.includes('png') ? 'png' : 'jpeg'
    }

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

  return {
    documentType: documentTypeMatch?.[1] || 'Unknown',
    confidence: 'low',
    extractedData: {
      year: yearMatch?.[1],
      amounts: amounts.length > 0 ? amounts : undefined,
    },
    summary: responseText.substring(0, 300),
    notes: ['Analysis extracted from text response - may need manual review'],
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

      // Convert buffer to base64 for OpenAI
      const base64Image = fileBuffer.toString('base64')
      let imageFormat: 'png' | 'jpeg' | 'pdf'
      
      if (mimeType === 'application/pdf') {
        imageFormat = 'pdf'
      } else if (mimeType.includes('png')) {
        imageFormat = 'png'
      } else {
        imageFormat = 'jpeg'
      }

      // Analyze the document using base64 data
      const analysis = await analyzeDocumentFromBuffer(base64Image, doc.filename, imageFormat)
      results.push({
        filename: doc.filename,
        analysis,
        ...(analysis === null && {
          error: 'AI analysis unavailable. In Vercel, set OPENAI_API_KEY for Production and Preview and redeploy.',
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

