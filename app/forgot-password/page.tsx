'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FilingIQLogo from '@/components/FilingIQLogo'
import HolographicPanel from '@/components/HolographicPanel'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || 'An error occurred. Please try again.')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
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
            Forgot Password
          </h1>
          
          {success ? (
            <div className="space-y-4">
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-sm text-green-400">
                <p className="font-semibold mb-2">✓ Check your email</p>
                <p>
                  If an account with that email exists, we've sent you a password reset link.
                  Please check your inbox and follow the instructions.
                </p>
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-filingiq-cyan hover:bg-filingiq-cyan/80 text-filingiq-dark font-semibold py-3 px-4 rounded-lg transition-colors shadow-glow-cyan"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-gray-400 text-sm mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-filingiq-dark/50 border border-filingiq-cyan/30 rounded-lg text-white focus:ring-2 focus:ring-filingiq-cyan focus:border-transparent"
                  placeholder="you@company.com"
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
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <p className="text-center text-sm text-gray-400 mt-4">
                Remember your password?{' '}
                <a href="/login" className="text-filingiq-cyan hover:underline">
                  Back to Login
                </a>
              </p>
            </form>
          )}
        </HolographicPanel>
      </div>
    </main>
  )
}
