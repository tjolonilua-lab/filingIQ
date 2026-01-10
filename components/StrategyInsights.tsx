'use client'

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

  return (
    <div className="space-y-6">
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
          Document Analysis ({successful.length} document{successful.length !== 1 ? 's' : ''})
        </h3>
        <div className="space-y-4">
          {successful.map((result, index) => (
            <DocumentAnalysisCard
              key={index}
              filename={result.filename}
              analysis={result.analysis!}
            />
          ))}
        </div>
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

function DocumentAnalysisCard({
  filename,
  analysis,
}: {
  filename: string
  analysis: DocumentAnalysis
}) {
  const confidenceColors = {
    high: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-red-100 text-red-800',
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-filingiq-blue">{filename}</h4>
          <p className="text-sm text-gray-600 mt-1">
            {analysis.documentType}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${confidenceColors[analysis.confidence]}`}
        >
          {analysis.confidence} confidence
        </span>
      </div>

      {analysis.extractedData.year && (
        <div className="mb-3">
          <span className="text-sm font-medium text-gray-700">Tax Year: </span>
          <span className="text-sm text-gray-900">{analysis.extractedData.year}</span>
        </div>
      )}

      {analysis.extractedData.amounts && analysis.extractedData.amounts.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Amounts Found:</p>
          <div className="space-y-1">
            {analysis.extractedData.amounts.map((amount, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600">{amount.label}:</span>
                <span className="font-medium text-gray-900">
                  ${amount.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.summary && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-1">Analysis Summary:</p>
          <p className="text-sm text-gray-600">{analysis.summary}</p>
        </div>
      )}

      {analysis.notes && analysis.notes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-1">Strategy Notes:</p>
          <ul className="list-disc list-inside space-y-1">
            {analysis.notes.map((note, idx) => (
              <li key={idx} className="text-sm text-gray-600">{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

