'use client'

import { useState, useEffect } from 'react'
import { FilingIQLogo, AdminSidebar, ClientsView, SettingsView, FormBuilderView } from '@/components'
import type { IntakeSubmission } from '@/lib/validation'

export default function AdminPage() {
  const [activeView, setActiveView] = useState<'form-builder' | 'clients' | 'settings'>('form-builder')
  const [submissions, setSubmissions] = useState<Array<IntakeSubmission & { id: string }>>([])
  const [loading, setLoading] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [accountId, setAccountId] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = () => {
      const storedAccountId = localStorage.getItem('account_id')
      if (storedAccountId) {
        setAccountId(storedAccountId)
        setAuthenticated(true)
        if (activeView === 'clients') {
          fetchSubmissions()
        }
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/login'
      }
    }
    
    // Small delay to ensure localStorage is available
    checkAuth()
  }, [activeView])

  const fetchSubmissions = async () => {
    if (!accountId) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/submissions', {
        headers: {
          'Authorization': `Bearer ${accountId}`,
          'X-Account-Id': accountId,
        },
      })

      const data = await response.json()
      // Handle both response formats: data.submissions (direct) or data.data.submissions (nested)
      const submissions = data.submissions || data.data?.submissions
      if (data.success) {
        setSubmissions(submissions || [])
      }
    } catch (error) {
      // Error fetching submissions - handled by loading state
    } finally {
      setLoading(false)
    }
  }

  // Fetch submissions when switching to clients view
  useEffect(() => {
    if (activeView === 'clients' && accountId && submissions.length === 0) {
      fetchSubmissions()
    }
  }, [activeView, accountId])

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-filingiq-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar activeView={activeView} onViewChange={setActiveView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200/60 shadow-sm sticky top-0 z-40">
          <div className="px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <FilingIQLogo size="sm" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-xs text-gray-500 mt-0.5">Manage your FilingIQ account and clients</p>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('account_id')
                  localStorage.removeItem('account_email')
                  window.location.href = '/login'
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="px-6 lg:px-8 py-8">
            {activeView === 'form-builder' ? (
              <FormBuilderView accountId={accountId} />
            ) : activeView === 'clients' ? (
              <ClientsView submissions={submissions} loading={loading} />
            ) : (
              <SettingsView accountId={accountId} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}


