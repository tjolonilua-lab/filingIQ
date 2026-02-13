'use client'

import type { DocumentAnalysis } from '@/lib/validation'

interface AnalysisResultsProps {
  analyses: Array<{
    filename: string
    analysis: DocumentAnalysis | null
    error?: string
  }>
  isLoading?: boolean
}

export default function AnalysisResults({ analyses, isLoading }: AnalysisResultsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3 text-filingiq-blue">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-filingiq-blue"></div>
          <span className="font-medium">Analyzing documents with AI...</span>
        </div>
        <p className="text-sm text-gray-600">This may take a moment.</p>
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
  const failed = analyses.filter((a) => !a.analysis && a.error)

  return (
    <div className="space-y-6">
      {successful.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-filingiq-blue mb-4">
            Analysis Results ({successful.length} document{successful.length !== 1 ? 's' : ''})
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
      )}

      {failed.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-600 mb-4">
            Analysis Issues ({failed.length})
          </h3>
          <div className="space-y-2">
            {failed.map((result, index) => (
              <div
                key={index}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="font-medium text-red-900">{result.filename}</p>
                <p className="text-sm text-red-700 mt-1">{result.error}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
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

      {(analysis.extractedData.employer || analysis.extractedData.payer) && (
        <div className="mb-3">
          <span className="text-sm font-medium text-gray-700">
            {analysis.extractedData.employer ? 'Employer' : 'Payer'}:{' '}
          </span>
          <span className="text-sm text-gray-900">
            {analysis.extractedData.employer || analysis.extractedData.payer}
          </span>
        </div>
      )}

      {analysis.summary && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-1">Summary:</p>
          <p className="text-sm text-gray-600">{analysis.summary}</p>
        </div>
      )}

      {analysis.notes && analysis.notes.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
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

