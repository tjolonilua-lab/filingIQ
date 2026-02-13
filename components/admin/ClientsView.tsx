'use client'

import type { IntakeSubmission } from '@/lib/validation'

interface ClientsViewProps {
  submissions: Array<IntakeSubmission & { id: string }>
  loading: boolean
}

export default function ClientsView({ submissions, loading }: ClientsViewProps) {

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-filingiq-blue/30 border-t-filingiq-blue mx-auto"></div>
        <p className="mt-4 text-gray-600 text-sm">Loading clients...</p>
      </div>
    )
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-filingiq-blue/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-filingiq-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">No clients yet</h3>
          <p className="text-gray-600">Client submissions will appear here once they complete the intake form.</p>
          <div className="pt-4">
            <p className="text-sm text-gray-500">Share your intake link from Settings to start receiving submissions.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Client Submissions</h2>
        <p className="text-sm text-gray-600">{submissions.length} {submissions.length === 1 ? 'client' : 'clients'}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map((client) => (
          <ClientCard key={client.id} client={client} />
        ))}
      </div>
    </div>
  )
}

function ClientCard({ client }: { client: IntakeSubmission & { id: string } }) {
  const router = useRouter()
  const strategies = extractStrategiesFromClient(client)
  const totalSavings = calculatePotentialSavings(strategies)

  const handleCardClick = () => {
    router.push(`/admin/clients/${client.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6 hover:shadow-md hover:border-filingiq-blue/30 transition-all duration-200 cursor-pointer group"
    >
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-filingiq-blue transition-colors">
            {client.contactInfo.fullName}
          </h3>
          <p className="text-sm text-gray-600">{client.contactInfo.email}</p>
          <p className="text-xs text-gray-500 mt-1.5 flex items-center space-x-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{client.filingInfo.filingType}</span>
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500 mb-1">Strategies</p>
            <p className="text-2xl font-bold text-filingiq-blue">{strategies.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Documents</p>
            <p className="text-2xl font-bold text-gray-900">{client.documents.length}</p>
          </div>
          {totalSavings > 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-1">Potential Savings</p>
              <p className="text-2xl font-bold text-green-600">${totalSavings.toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="pt-2 flex items-center justify-between text-sm text-filingiq-blue group-hover:text-blue-600 transition-colors">
          <span className="font-medium">View Details</span>
          <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function extractStrategiesFromClient(client: IntakeSubmission): Array<{ title: string; savings: number }> {
  const strategies: Array<{ title: string; savings: number }> = []
  
  client.documents.forEach((doc) => {
    if (doc.analysis?.notes) {
      doc.analysis.notes.forEach((note) => {
        const savingsMatch = note.match(/\$([\d,]+)/)
        if (savingsMatch) {
          strategies.push({
            title: note.substring(0, 50),
            savings: parseInt(savingsMatch[1].replace(/,/g, '')) || 0,
          })
        }
      })
    }
  })

  return strategies
}

function calculatePotentialSavings(strategies: Array<{ savings: number }>): number {
  return strategies.reduce((sum, s) => sum + s.savings, 0)
}

