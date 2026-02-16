'use client'

import React from 'react'
import type { DocumentAnalysis } from '@/lib/validation'

interface StrategyInsightsProps {
  analyses: Array<{
    filename: string
    analysis: DocumentAnalysis | null
    error?: string
  }>
  isLoading?: boolean
}

export default function StrategyInsights({ analyses, isLoading }: StrategyInsightsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 text-filingiq-blue">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-filingiq-blue"></div>
          <span className="font-medium">Analyzing documents and identifying tax strategies...</span>
        </div>
        <p className="text-sm text-gray-600">This may take a moment. We're finding opportunities typically reserved for billionaires.</p>
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No analysis results available.</p>
      </div>
    )
  }

  const successful = analyses.filter((a) => a.analysis)
  const strategies = extractStrategies(successful)
  const hasNoSuccessfulAnalysis = successful.length === 0 && analyses.length > 0
  const firstError = hasNoSuccessfulAnalysis && analyses[0]?.error ? analyses[0].error : null

  return (
    <div className="space-y-6">
      {hasNoSuccessfulAnalysis && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          <p className="font-medium">Your document{analyses.length !== 1 ? 's were' : ' was'} received.</p>
          <p className="text-sm mt-1">
            AI analysis is not available for this submission. You can still submit your intake—your documents will be reviewed by your tax preparer.
          </p>
          {firstError && (
            <p className="text-sm mt-2 font-mono bg-amber-100/80 rounded px-2 py-1 break-words">
              Reason: {firstError}
            </p>
          )}
        </div>
      )}

      {strategies.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-xl font-bold text-filingiq-blue mb-3 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Identified Tax Strategies
          </h3>
          <div className="space-y-3">
            {strategies.map((strategy, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-filingiq-blue">
                <h4 className="font-semibold text-gray-900 mb-1">{strategy.title}</h4>
                <p className="text-sm text-gray-700">{strategy.description}</p>
                {strategy.potentialSavings && (
                  <p className="text-sm font-medium text-filingiq-blue mt-2">
                    Potential Savings: {strategy.potentialSavings}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-filingiq-blue mb-4">
          {successful.length > 0
            ? `Document Analysis (${successful.length} document${successful.length !== 1 ? 's' : ''})`
            : `Documents received (${analyses.length} document${analyses.length !== 1 ? 's' : ''})`}
        </h3>
        {successful.length > 0 ? (
          <div className="space-y-4">
            {successful.map((result, index) => (
              <DocumentAnalysisCard
                key={index}
                filename={result.filename}
                analysis={result.analysis!}
              />
            ))}
          </div>
        ) : (
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            {analyses.map((a, index) => (
              <li key={index}>
                {a.filename}
                {a.error && <span className="text-gray-500 text-sm"> — {a.error}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
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
  })

  // Remove duplicates
  const unique = strategies.filter((s, idx, self) => 
    idx === self.findIndex(t => t.title === s.title)
  )

  return unique
}

/** Render summary text with simple markdown (### ## ** and newlines) */
function SummaryBlock({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  const lines = text.split(/\n/)
  let key = 0
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      parts.push(<br key={key++} />)
      continue
    }
    if (trimmed.startsWith('#### ')) {
      parts.push(<h4 key={key++} className="text-sm font-semibold text-gray-900 mt-3 mb-1 first:mt-0">{formatInline(trimmed.slice(5))}</h4>)
      continue
    }
    if (trimmed.startsWith('### ')) {
      parts.push(<h3 key={key++} className="text-base font-semibold text-filingiq-blue mt-4 mb-1 first:mt-0">{formatInline(trimmed.slice(4))}</h3>)
      continue
    }
    if (trimmed.startsWith('## ')) {
      parts.push(<h3 key={key++} className="text-base font-semibold text-gray-900 mt-4 mb-1 first:mt-0">{formatInline(trimmed.slice(3))}</h3>)
      continue
    }
    parts.push(<p key={key++} className="text-sm text-gray-700 leading-relaxed">{formatInline(trimmed)}</p>)
  }
  return <div className="space-y-0.5">{parts}</div>
}

function formatInline(s: string): React.ReactNode {
  const out: React.ReactNode[] = []
  let rest = s
  let key = 0
  while (rest.length > 0) {
    const bold = rest.match(/\*\*([^*]+)\*\*/)
    if (bold && bold.index !== undefined) {
      if (bold.index > 0) out.push(<span key={key++}>{rest.slice(0, bold.index)}</span>)
      out.push(<strong key={key++} className="font-semibold text-gray-900">{bold[1]}</strong>)
      rest = rest.slice(bold.index + bold[0].length)
    } else {
      out.push(<span key={key++}>{rest}</span>)
      break
    }
  }
  return <>{out}</>
}

/** Pick key amounts to highlight: labeled first (e.g. Wages, Federal tax withheld), then by size */
function getKeyAmounts(amounts: Array<{ label: string; value: number; description?: string }>, max: number) {
  const hasMeaningfulLabels = amounts.some((a) => a.label && a.label !== 'Amount' && a.label !== 'Item')
  if (hasMeaningfulLabels) {
    const labeled = amounts.filter((a) => a.label && a.label !== 'Amount' && a.label !== 'Item')
    return labeled.slice(0, max)
  }
  return [...amounts]
    .sort((a, b) => b.value - a.value)
    .slice(0, max)
}

function DocumentAnalysisCard({
  filename,
  analysis,
}: {
  filename: string
  analysis: DocumentAnalysis
}) {
  const confidenceStyles = {
    high: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    medium: 'bg-amber-100 text-amber-800 border-amber-200',
    low: 'bg-rose-100 text-rose-800 border-rose-200',
  }
  const amounts = analysis.extractedData.amounts ?? []
  const keyAmounts = getKeyAmounts(amounts, 6)
  const fmt = (n: number) =>
    '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h4 className="font-semibold text-filingiq-blue truncate">{filename}</h4>
          <p className="text-sm text-gray-500 mt-0.5">{analysis.documentType}</p>
        </div>
        <span
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border ${confidenceStyles[analysis.confidence]}`}
        >
          {analysis.confidence} confidence
        </span>
      </div>

      {/* Key details: tax year + main amounts highlighted for quick scan */}
      <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/50 border border-slate-100">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {analysis.extractedData.year && (
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tax year</span>
              <p className="text-lg font-bold text-filingiq-blue mt-0.5">{analysis.extractedData.year}</p>
            </div>
          )}
          {keyAmounts.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {keyAmounts.map((a, idx) => (
                <div key={idx} className="bg-white/80 rounded-lg px-3 py-2 border border-slate-100 shadow-sm">
                  <span className="text-xs text-gray-500 block">
                    {a.label && a.label !== 'Amount' ? a.label : `Amount ${idx + 1}`}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-gray-900">{fmt(a.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Analysis summary — main focus */}
      {analysis.summary && (
        <div className="mb-5">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Analysis summary</h4>
          <div className="text-sm text-gray-700 prose prose-sm max-w-none">
            <SummaryBlock text={analysis.summary} />
          </div>
        </div>
      )}

      {/* Strategy notes — actionable recommendations */}
      {analysis.notes && analysis.notes.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Strategy notes</h4>
          <ul className="space-y-2">
            {analysis.notes.map((note, idx) => (
              <li key={idx} className="flex gap-2 text-sm text-gray-700">
                <span className="text-filingiq-blue mt-1.5 shrink-0 size-1.5 rounded-full bg-current" aria-hidden />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

