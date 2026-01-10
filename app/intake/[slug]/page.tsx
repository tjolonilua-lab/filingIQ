'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CompanyIntakePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [accountId, setAccountId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    fetchAccountBySlug(slug)
  }, [slug])

  useEffect(() => {
    // Redirect once accountId is found
    if (accountId && !redirecting) {
      setRedirecting(true)
      sessionStorage.setItem('intake_account_id', accountId)
      router.push(`/start?accountId=${accountId}`)
    }
  }, [accountId, redirecting, router])

  const fetchAccountBySlug = async (slug: string) => {
    try {
      const response = await fetch(`/api/account/lookup?slug=${slug}`)
      const data = await response.json()
      
      if (data.success && data.account) {
        setAccountId(data.account.id)
      } else {
        setError('Company intake link not found')
        setLoading(false)
      }
    } catch (error) {
      console.error('Error fetching account:', error)
      setError('Failed to load intake form')
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Intake Link Not Found</h1>
          <p className="text-gray-600">{error || 'The intake link you used is invalid or expired.'}</p>
        </div>
      </div>
    )
  }

  if (loading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-filingiq-blue"></div>
      </div>
    )
  }

  return null
}

