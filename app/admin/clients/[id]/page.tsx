'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FilingIQLogo, AIInsightsPanel, MetricsPanel, HolographicPanel } from '@/components'
import type { IntakeSubmission } from '@/lib/validation'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  
  const [client, setClient] = useState<(IntakeSubmission & { id: string }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const storedAccountId = localStorage.getItem('account_id')
    if (storedAccountId) {
      fetchClient(clientId, storedAccountId)
    } else {
      router.push('/login')
    }
  }, [clientId, router])

  const fetchClient = async (id: string, accId: string) => {
    try {
      const response = await fetch('/api/submissions', {
        headers: {
          'Authorization': `Bearer ${accId}`,
          'X-Account-Id': accId,
        },
      })

      const data = await response.json()
      if (data.success) {
        const found = data.submissions.find((s: IntakeSubmission & { id: string }) => s.id === id)
        if (found) {
          setClient(found)
        } else {
          setError('Client not found')
        }
      }
    } catch (error) {
      // Error fetching client - handled by error state
      setError('Failed to load client')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-filingiq-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-filingiq-cyan"></div>
      </main>
    )
  }

  if (error || !client) {
    return (
      <main className="min-h-screen bg-filingiq-dark flex items-center justify-center">
        <HolographicPanel>
          <p className="text-red-400">{error || 'Client not found'}</p>
          <button
            onClick={() => router.push('/admin')}
            className="mt-4 px-4 py-2 bg-filingiq-cyan text-filingiq-dark rounded-lg"
          >
            Back to Dashboard
          </button>
        </HolographicPanel>
      </main>
    )
  }

  const strategies = extractStrategies(client)
  const metrics = calculateMetrics(client)
  const chartData = generateChartData(client)
  const hasAIAnalysis = client.documents.some(doc => doc.analysis)

  const handleDownload = async (doc: { filename: string; urlOrPath: string }) => {
    try {
      // If it's an S3 URL, download directly
      if (doc.urlOrPath.startsWith('http')) {
        window.open(doc.urlOrPath, '_blank')
        return
      }

      // For local files, fetch via API
      const response = await fetch(`/api/download?path=${encodeURIComponent(doc.urlOrPath)}&filename=${encodeURIComponent(doc.filename)}`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to download file. Please try again.')
      }
    } catch (error) {
      // Download error - user sees alert
      alert('Failed to download file. Please try again.')
    }
  }

  const handleDownloadAll = async (documents: Array<{ filename: string; urlOrPath: string }>) => {
    // Download files one by one with a small delay
    for (let i = 0; i < documents.length; i++) {
      await handleDownload(documents[i])
      // Small delay between downloads to avoid browser blocking
      if (i < documents.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }
  }

  return (
    <main className="min-h-screen bg-filingiq-dark">
      {/* Header */}
      <div className="bg-filingiq-dark/80 backdrop-blur-sm border-b border-filingiq-cyan/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="text-filingiq-cyan hover:text-filingiq-cyan/80 transition-colors"
              >
                ← Back
              </button>
              <FilingIQLogo size="sm" />
              <div>
                <h1 className="text-2xl font-bold text-filingiq-cyan">{client.contactInfo.fullName}</h1>
                <p className="text-sm text-gray-400 mt-1">{client.contactInfo.email}</p>
              </div>
            </div>
            {client.documents.length > 0 && (
              <button
                onClick={() => handleDownloadAll(client.documents)}
                className="px-4 py-2 bg-filingiq-cyan/20 hover:bg-filingiq-cyan/30 border border-filingiq-cyan/50 rounded-lg text-filingiq-cyan font-medium transition-all duration-200 hover:border-filingiq-cyan/70 hover:shadow-lg hover:shadow-filingiq-cyan/20 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Documents ({client.documents.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Sora-style split layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasAIAnalysis && (
          <HolographicPanel glowColor="cyan" className="mb-6">
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-filingiq-cyan/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-filingiq-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Analysis Not Enabled</h3>
              <p className="text-gray-400 mb-4">
                To enable AI-powered document analysis and strategy recommendations, you need to:
              </p>
              <div className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-300">
                <p>1. Set <code className="bg-filingiq-dark/50 px-2 py-1 rounded">ENABLE_AI_ANALYSIS=true</code> in your environment variables</p>
                <p>2. Add your <code className="bg-filingiq-dark/50 px-2 py-1 rounded">OPENAI_API_KEY</code> to your <code className="bg-filingiq-dark/50 px-2 py-1 rounded">.env</code> file</p>
                <p>3. Restart your server</p>
              </div>
            </div>
          </HolographicPanel>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel - AI Insights (60%) - Only show if AI is enabled */}
          {hasAIAnalysis && (
            <div className="lg:col-span-3">
              <AIInsightsPanel strategies={strategies} />
            </div>
          )}

          {/* Right Panel - Metrics (40%) - Full width if no AI insights */}
          <div className={hasAIAnalysis ? "lg:col-span-2" : "lg:col-span-5"}>
            <MetricsPanel metrics={metrics} chartData={chartData} />
          </div>
        </div>

        {/* Client Information Panel */}
        <div className="mt-6">
          <HolographicPanel title="Client Information" glowColor="blue">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-filingiq-blue mb-3">Contact</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">Email:</span> <span className="text-white">{client.contactInfo.email}</span></p>
                  <p><span className="text-gray-400">Phone:</span> <span className="text-white">{client.contactInfo.phone}</span></p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-filingiq-blue mb-3">Filing Details</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-400">Type:</span> <span className="text-white">{client.filingInfo.filingType}</span></p>
                  <p><span className="text-gray-400">Status:</span> <span className="text-white">{client.filingInfo.isReturningClient ? 'Returning' : 'New'}</span></p>
                  <p><span className="text-gray-400">Submitted:</span> <span className="text-white">{new Date(client.submittedAt).toLocaleDateString()}</span></p>
                </div>
              </div>
            </div>
          </HolographicPanel>
        </div>

        {/* Documents Panel */}
        {client.documents.length > 0 && (
          <div className="mt-6">
            <HolographicPanel title="Client Documents" glowColor="cyan">
              <div className="space-y-3">
                {client.documents.map((doc, idx) => (
                  <div key={idx} className="bg-filingiq-dark/50 border border-filingiq-cyan/30 rounded-lg p-4 hover:border-filingiq-cyan/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-5 h-5 text-filingiq-cyan flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-white font-medium truncate">{doc.filename}</p>
                        </div>
                        <p className="text-sm text-gray-400">
                          {(doc.size / 1024).toFixed(1)} KB • {doc.type}
                        </p>
                        {doc.analysis && (
                          <div className="mt-3 pt-3 border-t border-filingiq-cyan/20">
                            <p className="text-xs text-filingiq-cyan mb-1">AI Analysis:</p>
                            <p className="text-sm text-gray-300">{doc.analysis.documentType}</p>
                            {doc.analysis.summary && (
                              <p className="text-xs text-gray-400 mt-2">{doc.analysis.summary.substring(0, 150)}...</p>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="flex-shrink-0 px-4 py-2 bg-filingiq-cyan/20 hover:bg-filingiq-cyan/30 border border-filingiq-cyan/50 rounded-lg text-filingiq-cyan text-sm font-medium transition-all duration-200 hover:border-filingiq-cyan/70 hover:shadow-lg hover:shadow-filingiq-cyan/20 flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {client.documents.length > 1 && (
                <div className="mt-4 pt-4 border-t border-filingiq-cyan/20">
                  <button
                    onClick={() => handleDownloadAll(client.documents)}
                    className="w-full px-4 py-3 bg-filingiq-cyan/20 hover:bg-filingiq-cyan/30 border border-filingiq-cyan/50 rounded-lg text-filingiq-cyan font-medium transition-all duration-200 hover:border-filingiq-cyan/70 hover:shadow-lg hover:shadow-filingiq-cyan/20 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download All Documents</span>
                  </button>
                </div>
              )}
            </HolographicPanel>
          </div>
        )}
      </div>
    </main>
  )
}

function extractStrategies(client: IntakeSubmission): Array<{
  title: string
  description: string
  potentialSavings?: string
  confidence: 'high' | 'medium' | 'low'
  category: string
}> {
  const strategies: Array<{
    title: string
    description: string
    potentialSavings?: string
    confidence: 'high' | 'medium' | 'low'
    category: string
  }> = []

  // Extract from document analyses
  client.documents.forEach((doc) => {
    if (doc.analysis) {
      // Look for retirement strategies
      const text = `${doc.analysis.summary} ${doc.analysis.notes?.join(' ') || ''}`.toLowerCase()
      
      if (text.includes('retirement') || text.includes('401k') || text.includes('ira')) {
        strategies.push({
          title: 'Retirement Contribution Optimization',
          description: 'Maximize retirement contributions to reduce taxable income and build long-term wealth.',
          potentialSavings: 'Up to $6,500-$7,500 (IRA) or $22,500+ (401k)',
          confidence: doc.analysis.confidence,
          category: 'Retirement',
        })
      }

      if (text.includes('deduction') || text.includes('expense')) {
        strategies.push({
          title: 'Deduction Maximization',
          description: 'Identify additional business expenses and deductions to reduce taxable income.',
          confidence: doc.analysis.confidence,
          category: 'Deductions',
        })
      }

      if (text.includes('income') && (text.includes('timing') || text.includes('defer'))) {
        strategies.push({
          title: 'Income Timing Strategy',
          description: 'Optimize when income is recognized to minimize tax liability across years.',
          confidence: doc.analysis.confidence,
          category: 'Income Planning',
        })
      }
    }
  })

  // Remove duplicates
  const unique = strategies.filter((s, idx, self) => 
    idx === self.findIndex(t => t.title === s.title)
  )

  return unique.length > 0 ? unique : [{
    title: 'Analysis in Progress',
    description: 'AI is analyzing documents to identify personalized tax strategies.',
    confidence: 'medium',
    category: 'General',
  }]
}

function calculateMetrics(client: IntakeSubmission): Array<{
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  change?: string
}> {
  const totalIncome = client.documents
    .flatMap(d => d.analysis?.extractedData.amounts || [])
    .reduce((sum, a) => sum + a.value, 0)

  const documentCount = client.documents.length
  const analyzedCount = client.documents.filter(d => d.analysis).length

  return [
    {
      label: 'Total Income',
      value: `$${totalIncome.toLocaleString()}`,
      trend: 'neutral',
    },
    {
      label: 'Documents',
      value: `${analyzedCount}/${documentCount}`,
      trend: analyzedCount === documentCount ? 'up' : 'neutral',
    },
    {
      label: 'Strategies',
      value: extractStrategies(client).length,
      trend: 'up',
    },
    {
      label: 'Tax Year',
      value: client.documents[0]?.analysis?.extractedData.year || 'N/A',
      trend: 'neutral',
    },
  ]
}

function generateChartData(client: IntakeSubmission): Array<{ label: string; value: number }> {
  // Generate sample chart data based on strategies
  const strategies = extractStrategies(client)
  const baseValue = 1000

  return [
    { label: 'Q1', value: baseValue },
    { label: 'Q2', value: baseValue + (strategies.length * 200) },
    { label: 'Q3', value: baseValue + (strategies.length * 400) },
    { label: 'Q4', value: baseValue + (strategies.length * 600) },
  ]
}

