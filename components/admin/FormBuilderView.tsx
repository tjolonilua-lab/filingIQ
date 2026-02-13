'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import Toast from '@/components/ui/Toast'
import FormBuilder from '@/components/forms/FormBuilder'

interface FormBuilderViewProps {
  accountId: string | null
}

export default function FormBuilderView({ accountId }: FormBuilderViewProps) {
  const { toasts, showToast, removeToast } = useToast()
  const [settings, setSettings] = useState({
    slug: '',
  })
  
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  const loadAccountSettings = async () => {
    if (!accountId) return
    
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'X-Account-Id': accountId,
        },
      })
      
      if (!response.ok) {
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to load settings: ${response.status}`)
        } catch (jsonError) {
          throw new Error(`Failed to load settings: ${response.status} ${response.statusText}`)
        }
      }
      
      const data = await response.json()
      if (data.success && data.account) {
        const acc = data.account
        setSettings({
          slug: acc.slug || '',
        })
      } else {
        console.warn('Account settings response missing success or account data:', data)
      }
    } catch (error) {
      console.error('Error loading account settings:', error)
      if (error instanceof Error && !error.message.includes('Failed to fetch')) {
        showToast('Failed to load account settings. Using default values.', 'error')
      }
    }
  }

  // Load account settings on mount
  useEffect(() => {
    if (accountId && initialLoad) {
      loadAccountSettings()
      setInitialLoad(false)
    }
  }, [accountId, initialLoad])

  const [intakeLink, setIntakeLink] = useState('')
  const [baseUrl, setBaseUrl] = useState('https://filingiq.com')
  const [saving, setSaving] = useState(false)

  // Set base URL on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  // Check slug availability
  const checkSlug = async (slug: string) => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null)
      return
    }

    // Normalize slug (lowercase, trim)
    const normalizedSlug = slug.toLowerCase().trim()
    
    setCheckingSlug(true)
    try {
      const url = `/api/account/check-slug?slug=${encodeURIComponent(normalizedSlug)}${accountId ? `&excludeAccountId=${accountId}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (!data.success) {
        console.error('Slug check failed:', data.error)
        setSlugAvailable(null)
        return
      }
      
      setSlugAvailable(data.available || false)
    } catch (error) {
      console.error('Error checking slug:', error)
      setSlugAvailable(null)
    } finally {
      setCheckingSlug(false)
    }
  }

  // Debounce slug check
  useEffect(() => {
    if (settings.slug) {
      const timer = setTimeout(() => {
        checkSlug(settings.slug)
      }, 500)

      return () => clearTimeout(timer)
    } else {
      setSlugAvailable(null)
      return undefined
    }
  }, [settings.slug, accountId])

  useEffect(() => {
    // Generate intake link using our domain with company slug
    if (settings.slug) {
      setIntakeLink(`${baseUrl}/intake/${settings.slug}`)
    } else {
      setIntakeLink('')
    }
  }, [settings.slug, baseUrl])

  const handleSave = async () => {
    if (!accountId) return
    
    // Validate slug before saving
    if (settings.slug) {
      const normalizedSlug = settings.slug.toLowerCase().trim()
      if (normalizedSlug.length < 2) {
        showToast('Slug must be at least 2 characters', 'error')
        return
      }
      
      // Check availability one more time before saving
      try {
        const checkResponse = await fetch(`/api/account/check-slug?slug=${encodeURIComponent(normalizedSlug)}&excludeAccountId=${accountId}`)
        const checkData = await checkResponse.json()
        
        if (!checkData.available) {
          showToast('This slug is not available. Please choose a different one.', 'error')
          return
        }
      } catch (error) {
        console.error('Error validating slug:', error)
        showToast('Could not validate slug. Please try again.', 'error')
        return
      }
    }
    
    setSaving(true)
    try {
      // Normalize slug before saving
      const updateData: any = {}
      
      if (settings.slug) {
        updateData.slug = settings.slug.toLowerCase().trim()
      }
      
      // Update account info
      const accountResponse = await fetch('/api/account/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Account-Id': accountId,
        },
        body: JSON.stringify(updateData),
      })

      if (!accountResponse.ok) {
        const errorData = await accountResponse.json()
        throw new Error(errorData.error || 'Failed to update account')
      }

      // Reload account settings to get updated slug
      await loadAccountSettings()
      
      showToast('Settings saved successfully!', 'success')
    } catch (error) {
      console.error('Error saving settings:', error)
      showToast(error instanceof Error ? error.message : 'Failed to save settings. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      <div className="space-y-6">
        {/* Intake Link Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6 transition-shadow hover:shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Your Intake Link</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom URL Slug *
              </label>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="px-4 py-2.5 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-gray-600 text-sm font-mono">
                      {baseUrl}/intake/
                    </span>
                    <input
                      type="text"
                      value={settings.slug}
                      onChange={(e) => {
                        // Only allow lowercase letters, numbers, and hyphens
                        const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                        setSettings({ ...settings, slug })
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-filingiq-blue/50 focus:border-filingiq-blue transition-all duration-200 outline-none"
                      placeholder="your-company-name"
                      pattern="[a-z0-9-]+"
                    />
                  </div>
                  {checkingSlug && (
                    <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
                  )}
                  {!checkingSlug && settings.slug && slugAvailable === true && (
                    <p className="text-xs text-green-600 mt-1">✓ This slug is available</p>
                  )}
                  {!checkingSlug && settings.slug && slugAvailable === false && (
                    <p className="text-xs text-red-600 mt-1">✗ This slug is already taken</p>
                  )}
                  {settings.slug && settings.slug.length < 2 && (
                    <p className="text-xs text-gray-500 mt-1">Slug must be at least 2 characters</p>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Intake URL
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={intakeLink || 'Enter a slug above to generate your intake link'}
                  readOnly
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-mono text-sm"
                />
                <button
                  onClick={() => {
                    if (intakeLink) {
                      window.open(intakeLink, '_blank')
                    }
                  }}
                  disabled={!intakeLink}
                  className="px-4 py-2.5 bg-filingiq-blue text-white rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 shadow-sm hover:shadow-md disabled:hover:shadow-sm"
                  title="Open intake form in new tab"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>Launch</span>
                </button>
                <button
                  onClick={() => {
                    if (intakeLink) {
                      navigator.clipboard.writeText(intakeLink)
                      showToast('Link copied to clipboard!', 'success')
                    }
                  }}
                  disabled={!intakeLink}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 hover:border-gray-400"
                  title="Copy link to clipboard"
                >
                  Copy
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Share this link with your clients to start collecting tax documents and AI strategy insights.
              </p>
              <div className="mt-4 p-3 bg-blue-50/80 border border-blue-200/60 rounded-lg">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong className="font-semibold">Note:</strong> This link uses FilingIQ's domain. For a custom subdomain (e.g., intake.yourcompany.com), 
                  you'll need to configure DNS CNAME records pointing to FilingIQ's servers. Contact support for assistance.
                </p>
              </div>
            </div>
          </div>
          
          {/* Save Button for Slug */}
          <div className="flex justify-end pt-4 mt-6 border-t border-gray-200/60">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-filingiq-blue hover:bg-blue-600 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md disabled:hover:shadow-sm"
            >
              {saving ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </span>
              ) : (
                'Save Slug'
              )}
            </button>
          </div>
        </div>

        {/* Form Builder */}
        <FormBuilder accountId={accountId} />
      </div>
    </>
  )
}

