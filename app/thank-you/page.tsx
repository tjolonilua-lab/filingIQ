'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components'
import { getBusinessBranding } from '@/lib/branding'

function ThankYouContent() {
  const searchParams = useSearchParams()
  const accountId = searchParams.get('accountId')
  const defaultBranding = getBusinessBranding()
  const [branding, setBranding] = useState(defaultBranding)

  useEffect(() => {
    if (accountId) {
      // Load company-specific branding
      fetch(`/api/auth/me`, {
        headers: {
          'X-Account-Id': accountId,
        },
      })
        .then(res => res.json())
        .then(data => {
          // Handle both response formats: data.account (direct) or data.data.account (nested)
          const account = data.account || data.data?.account
          if (data.success && account) {
            setBranding({
              businessName: account.companyName,
              businessEmail: account.email,
              businessPhone: account.settings?.phone || '',
              businessWebsite: account.website,
              mainWebsiteUrl: account.settings?.mainWebsiteUrl,
              primaryColor: account.settings?.primaryColor || defaultBranding.primaryColor,
              accentColor: account.settings?.accentColor || defaultBranding.accentColor,
            })
          }
        })
        .catch(_err => {
          // Error loading branding - non-critical
          // Keep default branding on error
        })
    }
  }, [accountId, defaultBranding])
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50">
      <div className="w-full max-w-2xl text-center space-y-8 bg-white rounded-lg shadow-sm p-8 md:p-12">
        <div className="space-y-4">
          <div 
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: branding.accentColor || '#00A3FF' }}
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: branding.primaryColor }}>
            Thank You!
          </h1>
          <p className="text-lg text-gray-700">
            Your documents have been received and analyzed.
          </p>
          <p className="text-gray-600">
            Our AI is identifying personalized tax strategies tailored to your situation. We'll reach out within 1–2 business days with actionable recommendations.
          </p>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <h2 className="text-xl font-semibold mb-4" style={{ color: branding.primaryColor }}>
            {branding.businessName}
          </h2>
          <div className="space-y-2 text-gray-600">
            <p>Email: {branding.businessEmail}</p>
            {branding.businessPhone && (
              <p>Phone: {branding.businessPhone}</p>
            )}
          </div>
        </div>

        <div className="pt-6">
          {(() => {
            // Normalize website URL
            let websiteUrl = branding.mainWebsiteUrl || branding.businessWebsite
            if (websiteUrl) {
              // Remove any existing protocol
              websiteUrl = websiteUrl.trim().replace(/^https?:\/\//, '')
              // Add https:// prefix
              websiteUrl = `https://${websiteUrl}`
            }
            
            return websiteUrl ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-lg font-semibold transition-colors text-white shadow-lg hover:opacity-90"
                style={{ 
                  backgroundColor: branding.primaryColor,
                  boxShadow: `0 4px 6px -1px ${branding.primaryColor}40`,
                }}
              >
                Return to {branding.businessName}
              </a>
            ) : (
              <Button href="/" variant="primary">
                Return to Home
              </Button>
            )
          })()}
        </div>
      </div>
    </main>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-filingiq-blue"></div>
      </main>
    }>
      <ThankYouContent />
    </Suspense>
  )
}

