'use client'

import { useState, useEffect } from 'react'
import FilingIQLogo from '@/components/FilingIQLogo'
import Button from '@/components/Button'
import HolographicPanel from '@/components/HolographicPanel'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    password: '',
    website: '',
    slug: '',
  })
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Auto-generate slug from company name
  useEffect(() => {
    if (formData.companyName && !formData.slug) {
      const generated = formData.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50)
      setFormData(prev => ({ ...prev, slug: generated }))
    }
  }, [formData.companyName])

  // Check slug availability
  const checkSlug = async (slug: string) => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null)
      return
    }

    setCheckingSlug(true)
    try {
      const response = await fetch(`/api/account/check-slug?slug=${encodeURIComponent(slug)}`)
      const data = await response.json()
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
    const timer = setTimeout(() => {
      if (formData.slug) {
        checkSlug(formData.slug)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (slugAvailable === false) {
      setError('Please choose a different URL slug')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Store account ID in localStorage for session management
        localStorage.setItem('account_id', data.account.id)
        localStorage.setItem('account_email', data.account.email)
        // Redirect to admin
        window.location.href = '/admin'
      } else {
        setError(data.error || 'Failed to create account')
      }
    } catch (error) {
      console.error('Signup error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-filingiq-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <FilingIQLogo size="lg" showTagline={true} />
        </div>
        
        <HolographicPanel glowColor="cyan">
          <h1 className="text-2xl font-bold text-filingiq-cyan mb-6 text-center">
            Sign Up for FilingIQ
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-2">
                Company Name
              </label>
              <input
                id="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-2 bg-filingiq-dark/50 border border-filingiq-cyan/30 rounded-lg text-white focus:ring-2 focus:ring-filingiq-cyan focus:border-transparent"
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-filingiq-dark/50 border border-filingiq-cyan/30 rounded-lg text-white focus:ring-2 focus:ring-filingiq-cyan focus:border-transparent"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-2">
                Company Website
              </label>
              <input
                id="website"
                type="url"
                required
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 bg-filingiq-dark/50 border border-filingiq-cyan/30 rounded-lg text-white focus:ring-2 focus:ring-filingiq-cyan focus:border-transparent"
                placeholder="https://www.yourcompany.com"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-2">
                Intake URL Slug
                <span className="text-xs text-gray-400 ml-2">(e.g., "flo-financial")</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  filingiq.com/intake/
                </div>
                <input
                  id="slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                    setFormData({ ...formData, slug: value })
                  }}
                  className="w-full pl-[180px] pr-4 py-2 bg-filingiq-dark/50 border border-filingiq-cyan/30 rounded-lg text-white focus:ring-2 focus:ring-filingiq-cyan focus:border-transparent"
                  placeholder="flo-financial"
                  pattern="[a-z0-9-]+"
                />
              </div>
              {formData.slug && (
                <div className="mt-2">
                  {checkingSlug ? (
                    <p className="text-xs text-gray-400">Checking availability...</p>
                  ) : slugAvailable === true ? (
                    <p className="text-xs text-green-400">✓ Available</p>
                  ) : slugAvailable === false ? (
                    <p className="text-xs text-red-400">✗ Not available</p>
                  ) : null}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Only lowercase letters, numbers, and hyphens allowed
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 bg-filingiq-dark/50 border border-filingiq-cyan/30 rounded-lg text-white focus:ring-2 focus:ring-filingiq-cyan focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-filingiq-cyan hover:bg-filingiq-cyan/80 text-filingiq-dark font-semibold py-3 px-4 rounded-lg transition-colors shadow-glow-cyan mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="text-center text-sm text-gray-400 mt-4">
              Already have an account?{' '}
              <a href="/login" className="text-filingiq-cyan hover:underline">
                Login
              </a>
            </p>
          </form>
        </HolographicPanel>
      </div>
    </main>
  )
}

