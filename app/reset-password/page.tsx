'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import FilingIQLogo from '@/components/FilingIQLogo'
import HolographicPanel from '@/components/HolographicPanel'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState('')
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      setError('Invalid reset link. Please request a new password reset.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(data.error || 'Failed to reset password. The link may have expired.')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!token && !error) {
    return (
      <main className="min-h-screen bg-filingiq-dark flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <FilingIQLogo size="lg" showTagline={true} />
          </div>
          <HolographicPanel glowColor="cyan">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-filingiq-cyan/30 border-t-filingiq-cyan mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading...</p>
            </div>
          </HolographicPanel>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-filingiq-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <FilingIQLogo size="lg" showTagline={true} />
        </div>
        
        <HolographicPanel glowColor="cyan">
          <h1 className="text-2xl font-bold text-filingiq-cyan mb-6 text-center">
            Reset Password
          </h1>
          
          {success ? (
            <div className="space-y-4">
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-sm text-green-400">
                <p className="font-semibold mb-2">✓ Password Reset Successful</p>
                <p>Your password has been reset. Redirecting to login...</p>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-filingiq-cyan hover:bg-filingiq-cyan/80 text-filingiq-dark font-semibold py-3 px-4 rounded-lg transition-colors shadow-glow-cyan"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-filingiq-dark/50 border border-filingiq-cyan/30 rounded-lg text-white focus:ring-2 focus:ring-filingiq-cyan focus:border-transparent"
                  placeholder="••••••••"
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 bg-filingiq-dark/50 border border-filingiq-cyan/30 rounded-lg text-white focus:ring-2 focus:ring-filingiq-cyan focus:border-transparent"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-filingiq-cyan hover:bg-filingiq-cyan/80 text-filingiq-dark font-semibold py-3 px-4 rounded-lg transition-colors shadow-glow-cyan mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <p className="text-center text-sm text-gray-400 mt-4">
                <a href="/forgot-password" className="text-filingiq-cyan hover:underline">
                  Request a new reset link
                </a>
              </p>
            </form>
          )}
        </HolographicPanel>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-filingiq-dark flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-8">
              <FilingIQLogo size="lg" showTagline={true} />
            </div>
            <HolographicPanel glowColor="cyan">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-filingiq-cyan/30 border-t-filingiq-cyan mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading...</p>
              </div>
            </HolographicPanel>
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
