'use client'

import { useState, useEffect } from 'react'
import { getBusinessBranding } from '@/lib/branding'
import { useToast } from './Toast'
import Toast from './Toast'

interface SettingsViewProps {
  accountId: string | null
}

export default function SettingsView({ accountId }: SettingsViewProps) {
  const branding = getBusinessBranding()
  const { toasts, showToast, removeToast } = useToast()
  const [settings, setSettings] = useState({
    companyName: branding.businessName,
    email: branding.businessEmail,
    phone: branding.businessPhone,
    website: branding.businessWebsite,
    mainWebsiteUrl: branding.mainWebsiteUrl || '',
    primaryColor: branding.primaryColor,
    accentColor: branding.accentColor,
  })
  
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
        // If response is not OK, try to get error message from JSON
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to load settings: ${response.status}`)
        } catch (jsonError) {
          // If JSON parsing fails, throw a generic error
          throw new Error(`Failed to load settings: ${response.status} ${response.statusText}`)
        }
      }
      
      const data = await response.json()
      if (data.success && data.account) {
        const acc = data.account
        setSettings({
          companyName: acc.companyName,
          email: acc.email,
          phone: acc.settings?.phone || '',
          website: acc.website,
          mainWebsiteUrl: acc.settings?.mainWebsiteUrl || '',
          primaryColor: acc.settings?.primaryColor || branding.primaryColor,
          accentColor: acc.settings?.accentColor || branding.accentColor,
        })
      } else {
        console.warn('Account settings response missing success or account data:', data)
      }
    } catch (error) {
      console.error('Error loading account settings:', error)
      // Only show error toast if it's not a network error (which might be expected during initial load)
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

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!accountId) return
    
    setSaving(true)
    try {
      // Update account info
      const updateData: any = {
        companyName: settings.companyName,
        email: settings.email,
        website: settings.website,
      }
      
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

      // Update settings
      const settingsResponse = await fetch('/api/account/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Account-Id': accountId,
        },
        body: JSON.stringify({
          phone: settings.phone,
          mainWebsiteUrl: settings.mainWebsiteUrl,
          primaryColor: settings.primaryColor,
          accentColor: settings.accentColor,
        }),
      })

      if (!settingsResponse.ok) {
        const errorData = await settingsResponse.json()
        throw new Error(errorData.error || 'Failed to update settings')
      }

      // Reload account settings
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
      {/* Company Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6 transition-shadow hover:shadow-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Company Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-filingiq-blue/50 focus:border-filingiq-blue transition-all duration-200 outline-none"
              placeholder="Flo Financial & Tax Services"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email *
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-filingiq-blue/50 focus:border-filingiq-blue transition-all duration-200 outline-none"
              placeholder="info@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-filingiq-blue/50 focus:border-filingiq-blue transition-all duration-200 outline-none"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Website *
            </label>
            <input
              type="url"
              value={settings.website}
              onChange={(e) => setSettings({ ...settings, website: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-filingiq-blue/50 focus:border-filingiq-blue transition-all duration-200 outline-none"
              placeholder="flo-financial.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Website URL (for "Return to Main Website" link)
            </label>
            <input
              type="url"
              value={settings.mainWebsiteUrl}
              onChange={(e) => setSettings({ ...settings, mainWebsiteUrl: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-filingiq-blue/50 focus:border-filingiq-blue transition-all duration-200 outline-none"
              placeholder="https://www.flo-financial.com"
            />
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6 transition-shadow hover:shadow-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Branding</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-filingiq-blue focus:border-transparent"
                placeholder="#1e3a5f"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accent Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={settings.accentColor}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-filingiq-blue focus:border-transparent"
                placeholder="#22c55e"
              />
            </div>
          </div>
        </div>
      </div>


      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200/60">
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
            'Save Settings'
          )}
        </button>
      </div>
    </div>
    </>
  )
}

