'use client'

import type { DocumentAnalysis } from '@/lib/validation'

interface StrategyInsightsProps {
  analyses: Array<{
    filename: string
    analysis: DocumentAnalysis | null
    error?: string
  }>
  isLoading?: boolean
  /** Client name from intake (Step 1) for the high-level snapshot */
  clientName?: string
}

/** Sum amounts that look like income (wages, compensation, etc.) */
function sumIncome(analyses: Array<{ analysis: DocumentAnalysis | null }>): number {
  const incomeKeywords = /wage|tip|compensation|gross income|receipts|interest income|dividend|rental income|income(?! tax)/i
  let total = 0
  analyses.forEach(({ analysis }) => {
    analysis?.extractedData?.amounts?.forEach((a) => {
      if (incomeKeywords.test(a.label) && typeof a.value === 'number') total += a.value
    })
  })
  return total
}

/** Sum amounts that look like tax paid (withholding) */
function sumTaxPaid(analyses: Array<{ analysis: DocumentAnalysis | null }>): number {
  const taxKeywords = /tax withheld|withholding|federal income tax|state income tax|social security|medicare(?! wages)/i
  let total = 0
  analyses.forEach(({ analysis }) => {
    analysis?.extractedData?.amounts?.forEach((a) => {
      if (taxKeywords.test(a.label) && typeof a.value === 'number') total += a.value
    })
  })
  return total
}

/** First tax year found across analyses */
function getTaxYear(analyses: Array<{ analysis: DocumentAnalysis | null }>): string | null {
  for (const { analysis } of analyses) {
    const year = analysis?.extractedData?.year
    if (year != null && String(year).trim() !== '') return String(year)
  }
  return null
}

/** Build a short label of document types we saw (e.g. "W-2s, 1099-K, 1098") for the snapshot. */
function getDocumentTypesSummary(analyses: Array<{ analysis: DocumentAnalysis | null }>): string {
  const types = new Set<string>()
  analyses.forEach(({ analysis }) => {
    if (analysis?.documentType) types.add(analysis.documentType)
  })
  const list = Array.from(types)
  if (list.length === 0) return ''
  if (list.length === 1) return list[0]
  if (list.length === 2) return list.join(' and ')
  return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1]
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
}

export default function StrategyInsights({ analyses, isLoading, clientName }: StrategyInsightsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 text-filingiq-blue">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-filingiq-blue" />
          <span className="font-medium">Taking a quick look at your documents...</span>
        </div>
        <p className="text-sm text-gray-600">Your preparer will deliver a full strategy after you submit.</p>
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No documents to review.</p>
      </div>
    )
  }

  const successful = analyses.filter((a) => a.analysis)
  const strategies = extractStrategies(successful)
  const hasNoSuccessfulAnalysis = successful.length === 0 && analyses.length > 0
  const firstError = hasNoSuccessfulAnalysis && analyses[0]?.error ? analyses[0].error : null
  const docTypesSummary = getDocumentTypesSummary(successful)

  const totalIncome = sumIncome(successful)
  const totalTaxPaid = sumTaxPaid(successful)
  const taxYear = getTaxYear(successful)

  return (
    <div className="space-y-6">
      {/* High-level snapshot: name, income, tax year, tax paid */}
      <div className="rounded-xl bg-white border border-slate-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">At a glance</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <dt className="text-sm text-gray-500">Name</dt>
          <dd className="text-gray-900 font-medium">{clientName?.trim() || '—'}</dd>
          <dt className="text-sm text-gray-500">Tax year</dt>
          <dd className="text-gray-900 font-medium">{taxYear || '—'}</dd>
          <dt className="text-sm text-gray-500">Total income (from docs)</dt>
          <dd className="text-gray-900 font-medium">{totalIncome > 0 ? formatCurrency(totalIncome) : '—'}</dd>
          <dt className="text-sm text-gray-500">Total tax paid (from docs)</dt>
          <dd className="text-gray-900 font-medium">{totalTaxPaid > 0 ? formatCurrency(totalTaxPaid) : '—'}</dd>
        </dl>
      </div>

      {/* Snapshot: one line + reassurance */}
      <div className="rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-200 p-5">
        <p className="text-gray-800 font-medium">
          {successful.length > 0 ? (
            <>
              We took a quick look at your {analyses.length} document{analyses.length !== 1 ? 's' : ''}
              {docTypesSummary ? ` (${docTypesSummary})` : ''} and spotted some opportunities below.
            </>
          ) : (
            <>We received your {analyses.length} document{analyses.length !== 1 ? 's' : ''}.</>
          )}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Your preparer will review everything in detail and deliver a full tax strategy—this is just a sneak peek.
        </p>
      </div>

      {hasNoSuccessfulAnalysis && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          <p className="font-medium">Quick review wasn’t available for this run.</p>
          <p className="text-sm mt-1">
            Your documents are received. Submit below and your preparer will analyze them and get back to you.
          </p>
          {firstError && (
            <p className="text-sm mt-2 font-mono bg-amber-100/80 rounded px-2 py-1 break-words">
              Reason: {firstError}
            </p>
          )}
        </div>
      )}

      {/* Teaser: strategies we spotted */}
      {strategies.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-bold text-filingiq-blue mb-1">What we’re already seeing</h3>
          <p className="text-sm text-gray-600 mb-4">Your preparer will build on this and deliver a full plan.</p>
          <div className="space-y-3">
            {strategies.map((strategy, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-filingiq-blue">
                <h4 className="font-semibold text-gray-900 mb-1">{strategy.title}</h4>
                <p className="text-sm text-gray-700">{strategy.description}</p>
                {strategy.potentialSavings && (
                  <p className="text-sm font-medium text-filingiq-blue mt-2">
                    Potential savings: {strategy.potentialSavings}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-sm text-gray-500">
        Submit below to send your intake. Your preparer will review all {analyses.length} document{analyses.length !== 1 ? 's' : ''} and follow up with a detailed strategy.
      </p>
    </div>
  )
}

function extractStrategies(analyses: Array<{ analysis: DocumentAnalysis | null }>): Array<{
  title: string
  description: string
  potentialSavings?: string
}> {
  const strategies: Array<{ title: string; description: string; potentialSavings?: string }> = []
  
  analyses.forEach(({ analysis }) => {
    if (!analysis) return

    // Extract strategies from analysis summary and notes
    const text = `${analysis.summary} ${analysis.notes?.join(' ') || ''}`.toLowerCase()

    // Look for retirement contribution opportunities
    if (text.includes('retirement') || text.includes('401k') || text.includes('ira') || text.includes('sep')) {
      strategies.push({
        title: 'Retirement Contribution Optimization',
        description: 'Consider maximizing retirement contributions to reduce taxable income and build long-term wealth.',
        potentialSavings: 'Up to $6,500-$7,500 in tax savings (IRA) or $22,500+ (401k)',
      })
    }

    // Look for deduction opportunities
    if (text.includes('deduction') || text.includes('expense') || text.includes('business')) {
      strategies.push({
        title: 'Deduction Maximization',
        description: 'Identify additional business expenses and deductions to reduce your taxable income.',
        potentialSavings: 'Varies based on expenses',
      })
    }

    // Look for income timing
    if (text.includes('income') && (text.includes('timing') || text.includes('defer'))) {
      strategies.push({
        title: 'Income Timing Strategy',
        description: 'Optimize when income is recognized to minimize tax liability across years.',
      })
    }

    // Look for mortgage / itemizing (1098)
    if (text.includes('1098') || text.includes('mortgage') || text.includes('itemiz')) {
      strategies.push({
        title: 'Itemized Deductions',
        description: 'Mortgage interest and other itemized deductions may exceed the standard deduction—worth a closer look.',
        potentialSavings: 'Varies; often significant for mortgage interest',
      })
    }
  })

  // Remove duplicates
  const unique = strategies.filter((s, idx, self) => 
    idx === self.findIndex(t => t.title === s.title)
  )

  return unique
}

