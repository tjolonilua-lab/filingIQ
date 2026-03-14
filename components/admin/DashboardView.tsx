'use client'

import { useRouter } from 'next/navigation'
import type { IntakeSubmission } from '@/lib/validation'

const INCOME_LABELS = /wage|tip|compensation|gross income|receipts|income(?! tax)/i

function sumIncome(client: IntakeSubmission): number {
  let total = 0
  client.documents.forEach((d) => {
    d.analysis?.extractedData?.amounts?.forEach((a) => {
      if (INCOME_LABELS.test(a.label) && typeof a.value === 'number') total += a.value
    })
  })
  if (total > 0) return total
  client.documents.forEach((d) => {
    const summary = d.analysis?.summary
    if (!summary) return
    const matches = summary.match(/\$[\d,]+\.?\d*/g)
    if (matches?.length) {
      const parsed = matches.map((m) => parseFloat(m.replace(/[$,]/g, ''))).filter((n) => !isNaN(n) && n > 100)
      if (parsed.length) total += Math.max(...parsed)
    }
  })
  return total
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return d.toLocaleDateString()
}

interface DashboardViewProps {
  submissions: Array<IntakeSubmission & { id: string }>
  loading: boolean
  onNavigateToClients?: () => void
}

export default function DashboardView({ submissions, loading, onNavigateToClients }: DashboardViewProps) {
  const router = useRouter()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const thisMonth = submissions.filter((s) => new Date(s.submittedAt) >= startOfMonth).length
  const thisWeek = submissions.filter((s) => new Date(s.submittedAt) >= startOfWeek).length

  const topClients = [...submissions]
    .map((s) => ({ ...s, _income: sumIncome(s) }))
    .sort((a, b) => b._income - a._income)
    .slice(0, 5)

  const recentForTasks = [...submissions]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-filingiq-blue/30 border-t-filingiq-blue" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Overview</h2>
        <p className="text-sm text-gray-600">Business snapshot and priorities</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Submissions</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{submissions.length}</p>
          <p className="text-xs text-gray-500 mt-2">All time</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">This Month</p>
          <p className="text-3xl font-bold text-filingiq-blue mt-1">{thisMonth}</p>
          <p className="text-xs text-gray-500 mt-2">New submissions</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">This Week</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{thisWeek}</p>
          <p className="text-xs text-gray-500 mt-2">New submissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top clients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200/60">
            <h3 className="text-lg font-semibold text-gray-900">Top Clients</h3>
            <p className="text-sm text-gray-500">By estimated income from documents</p>
          </div>
          <div className="divide-y divide-gray-100">
            {topClients.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">No client data yet</div>
            ) : (
              topClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => router.push(`/admin/clients/${client.id}`)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-gray-900">{client.contactInfo.fullName}</p>
                    <p className="text-sm text-gray-500">{client.contactInfo.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-filingiq-blue">
                      {(client as { _income: number })._income > 0
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format((client as { _income: number })._income)
                        : '—'}
                    </p>
                    <p className="text-xs text-gray-500">{client.documents.length} docs</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Task list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200/60">
            <h3 className="text-lg font-semibold text-gray-900">To Review</h3>
            <p className="text-sm text-gray-500">Recent submissions to review</p>
          </div>
          <div className="divide-y divide-gray-100">
            {recentForTasks.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">No submissions yet</div>
            ) : (
              recentForTasks.map((client) => (
                <button
                  key={client.id}
                  onClick={() => router.push(`/admin/clients/${client.id}`)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-gray-900">Review {client.contactInfo.fullName}</p>
                    <p className="text-sm text-gray-500">Submitted {formatDate(client.submittedAt)}</p>
                  </div>
                  <span className="text-xs font-medium text-filingiq-blue bg-filingiq-blue/10 px-2 py-1 rounded">View</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      {onNavigateToClients && (
        <div className="flex flex-wrap gap-4">
          <button
            onClick={onNavigateToClients}
            className="px-4 py-2 bg-filingiq-blue text-white rounded-lg text-sm font-medium hover:bg-filingiq-blue/90"
          >
            View all clients →
          </button>
        </div>
      )}
    </div>
  )
}
