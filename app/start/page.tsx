'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { FormStep, FileUpload, StrategyInsights } from '@/components'
import {
  contactInfoSchema,
  filingInfoSchema,
  incomeTypesSchemaBase,
  type ContactInfo,
  type FilingInfo,
  type IncomeTypes,
  type DocumentAnalysis,
} from '@/lib/validation'

type FormData = ContactInfo & FilingInfo & IncomeTypes & { files: File[] }

const INCOME_TYPE_OPTIONS = [
  'W-2',
  '1099-NEC',
  '1099-K',
  'Investments / capital gains',
  'Rental income',
  'Self-employment income',
]

export default function StartPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [analysisResults, setAnalysisResults] = useState<Array<{
    filename: string
    urlOrPath?: string
    size?: number
    type?: string
    analysis: DocumentAnalysis | null
    error?: string
  }>>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  // Get accountId from URL search params or sessionStorage (set by /intake/[slug])
  const [accountId, setAccountId] = useState<string | null>(null)
  const [companyBranding, setCompanyBranding] = useState<{
    companyName: string
    primaryColor: string
    accentColor: string
    mainWebsiteUrl?: string
  } | null>(null)
  
  useEffect(() => {
    // Check URL params for accountId
    const params = new URLSearchParams(window.location.search)
    const urlAccountId = params.get('accountId')
    
    // Also check sessionStorage (set by /intake/[slug] route)
    const storedAccountId = sessionStorage.getItem('intake_account_id')
    
    const finalAccountId = urlAccountId || storedAccountId
    if (finalAccountId) {
      setAccountId(finalAccountId)
      // Load company branding
      fetch(`/api/auth/me`, {
        headers: {
          'X-Account-Id': finalAccountId,
        },
      })
      .then(res => res.json())
      .then(data => {
        // Handle both response formats: data.account (direct) or data.data.account (nested)
        const account = data.account || data.data?.account
        if (data.success && account) {
          setCompanyBranding({
            companyName: account.companyName,
            primaryColor: account.settings?.primaryColor || '#1e3a5f',
            accentColor: account.settings?.accentColor || '#22c55e',
            mainWebsiteUrl: account.settings?.mainWebsiteUrl,
          })
        }
      })
        .catch((_err: Error) => {
          // Error loading branding - non-critical, continue without it
        })
    }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(
      contactInfoSchema.merge(filingInfoSchema).merge(incomeTypesSchemaBase).refine(
        (data) => {
          // Require at least one income type OR an "other" description
          return (data.incomeTypes && data.incomeTypes.length > 0) || 
                 (data.otherIncome && data.otherIncome.trim().length > 0)
        },
        {
          message: 'Please select at least one income type or describe other income',
          path: ['incomeTypes'],
        }
      )
    ),
    mode: 'onBlur',
    defaultValues: {
      incomeTypes: [],
      isReturningClient: false,
    },
  })

  const watchedIncomeTypes = watch('incomeTypes') || []
  const watchedOtherIncome = watch('otherIncome')
  const [enableAIAnalysis, setEnableAIAnalysis] = useState(false)

  // Check business config on mount
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setEnableAIAnalysis(data.aiAnalysisEnabled || false))
      .catch(() => setEnableAIAnalysis(false))
  }, [])

  const handleIncomeTypeChange = (type: string, checked: boolean) => {
    const current = watchedIncomeTypes
    const newValue = checked
      ? [...current, type]
      : current.filter((t) => t !== type)
    setValue('incomeTypes', newValue, { shouldValidate: true })
  }

  const validateStep = async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        return await trigger(['fullName', 'email', 'phone'])
      case 2:
        return await trigger(['filingType', 'isReturningClient'])
      case 3:
        await trigger(['incomeTypes', 'otherIncome'])
        const hasIncomeTypes = watchedIncomeTypes.length > 0
        const hasOtherIncome = Boolean(watchedOtherIncome && watchedOtherIncome.trim().length > 0)
        return hasIncomeTypes || hasOtherIncome
      case 4:
        return files.length > 0
      case 5:
        return true // Analysis step doesn't need validation
      default:
        return true
    }
  }

  const handleNext = async () => {
    const isValid = await validateStep(currentStep)
    const maxStep = enableAIAnalysis ? 5 : 4
    
    if (isValid && currentStep < maxStep) {
      // If moving to step 5 (analysis), trigger analysis
      if (currentStep === 4 && enableAIAnalysis) {
        await handleAnalyzeDocuments()
      }
      setCurrentStep(currentStep + 1)
      setSubmitError(null)
    }
  }

  const handleAnalyzeDocuments = async () => {
    if (files.length === 0) return

    setIsAnalyzing(true)
    setAnalysisResults([])

    const filingType = watch('filingType')
    const BATCH_SIZE = 3
    const batches: File[][] = []
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      batches.push(files.slice(i, i + BATCH_SIZE))
    }

    try {
      const allResults: Array<{ filename: string; urlOrPath?: string; size?: number; type?: string; analysis: DocumentAnalysis | null; error?: string }> = []

      for (const batch of batches) {
        const formData = new FormData()
        batch.forEach((file) => formData.append('files', file))
        formData.append('analyze', 'true')
        if (filingType) {
          formData.append('filingInfo', JSON.stringify({ filingType }))
        }

        const response = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json().catch(() => ({}))
        const results = data.results ?? data.data?.results ?? []

        if (!response.ok) {
          const msg = data.error ?? data.message ?? (response.status === 413 ? 'Request too large (413). Documents are sent in batches; this batch failed.' : response.status === 504 ? 'Request timed out. Try again.' : `Analysis failed (${response.status}).`)
          batch.forEach((file) => allResults.push({ filename: file.name, analysis: null, error: msg }))
          continue
        }

        allResults.push(...(Array.isArray(results) ? results : []))
      }

      setAnalysisResults(allResults)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network or server error'
      setAnalysisResults(
        files.map((file) => ({
          filename: file.name,
          analysis: null,
          error: message.includes('fetch') || message.includes('Network') ? 'Connection failed. You can still submit your documents.' : `${message}. You can still submit your documents.`,
        }))
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setSubmitError(null)
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const formData = new FormData()
      formData.append('contactInfo', JSON.stringify({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      }))
      formData.append('filingInfo', JSON.stringify({
        filingType: data.filingType,
        isReturningClient: data.isReturningClient,
      }))
      formData.append('incomeInfo', JSON.stringify({
        incomeTypes: data.incomeTypes || [],
        otherIncome: data.otherIncome || '',
      }))

      // Prefer document refs from analyze (avoids 413). Send refs + only files for docs that have no ref.
      const hasDocumentRefs = enableAIAnalysis && analysisResults.length === files.length
      if (hasDocumentRefs) {
        const documentPayload = analysisResults.map((r) => ({
          filename: r.filename,
          urlOrPath: r.urlOrPath,
          size: r.size ?? 0,
          type: r.type ?? 'application/pdf',
          analysis: r.analysis ?? undefined,
        }))
        formData.append('documents', JSON.stringify(documentPayload))
        const missingRefs = analysisResults.filter((r) => !r.urlOrPath)
        for (const r of missingRefs) {
          const file = files.find((f) => f.name === r.filename)
          if (file) formData.append('files', file)
        }
      } else {
        files.forEach((file) => formData.append('files', file))
      }

      const url = accountId ? `/api/intake?accountId=${accountId}` : '/api/intake'
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let message = 'Submission failed'
        try {
          const text = await response.text()
          const parsed = text ? (() => { try { return JSON.parse(text) } catch { return null } })() : null
          if (parsed?.message) message = parsed.message
          else if (response.status === 413) message = 'Your submission is too large (server limit). Try submitting fewer or smaller documents.'
          else if (text && text.length < 200) message = text
        } catch {
          if (response.status === 413) message = 'Your submission is too large. Try fewer or smaller documents.'
        }
        throw new Error(message)
      }

      // Redirect to thank-you with accountId if available
      const thankYouUrl = accountId ? `/thank-you?accountId=${accountId}` : '/thank-you'
      router.push(thankYouUrl)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  const primaryColor = companyBranding?.primaryColor || '#00A3FF'
  const companyName = companyBranding?.companyName

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Company Header */}
        {companyName && (
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>
              {companyName}
            </h1>
            <p className="text-sm text-gray-600">Tax Intake Form</p>
          </div>
        )}

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: primaryColor }}>
              Step {currentStep} of {enableAIAnalysis ? 5 : 4}
            </span>
            <span className="text-sm text-gray-600">
              {Math.round((currentStep / (enableAIAnalysis ? 5 : 4)) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(currentStep / (enableAIAnalysis ? 5 : 4)) * 100}%`,
                backgroundColor: primaryColor
              }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Contact Info */}
          {currentStep === 1 && (
            <FormStep
              title="Contact Information"
              description="We'll use this to deliver your personalized tax strategy recommendations."
            >
              <div className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    {...register('fullName')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ 
                      '--tw-ring-color': primaryColor,
                    } as React.CSSProperties & { '--tw-ring-color': string }}
                    onFocus={(e) => {
                      e.target.style.borderColor = primaryColor
                      e.target.style.boxShadow = `0 0 0 2px ${primaryColor}40`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = ''
                      e.target.style.boxShadow = ''
                    }}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ 
                      '--tw-ring-color': primaryColor,
                    } as React.CSSProperties & { '--tw-ring-color': string }}
                    onFocus={(e) => {
                      e.target.style.borderColor = primaryColor
                      e.target.style.boxShadow = `0 0 0 2px ${primaryColor}40`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = ''
                      e.target.style.boxShadow = ''
                    }}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ 
                      '--tw-ring-color': primaryColor,
                    } as React.CSSProperties & { '--tw-ring-color': string }}
                    onFocus={(e) => {
                      e.target.style.borderColor = primaryColor
                      e.target.style.boxShadow = `0 0 0 2px ${primaryColor}40`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = ''
                      e.target.style.boxShadow = ''
                    }}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </FormStep>
          )}

          {/* Step 2: Filing Info */}
          {currentStep === 2 && (
            <FormStep
              title="Filing Information"
              description="Tell us about your tax filing situation."
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filing Type *
                  </label>
                  <select
                    {...register('filingType')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ 
                      '--tw-ring-color': primaryColor,
                    } as React.CSSProperties & { '--tw-ring-color': string }}
                    onFocus={(e) => {
                      e.target.style.borderColor = primaryColor
                      e.target.style.boxShadow = `0 0 0 2px ${primaryColor}40`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = ''
                      e.target.style.boxShadow = ''
                    }}
                  >
                    <option value="">Select filing type...</option>
                    <option value="Individual">Individual</option>
                    <option value="Married Filing Jointly">Married Filing Jointly</option>
                    <option value="Married Filing Separately">Married Filing Separately</option>
                    <option value="Head of Household">Head of Household</option>
                    <option value="Business (LLC/Sole Prop/S-Corp)">Business (LLC/Sole Prop/S-Corp)</option>
                  </select>
                  {errors.filingType && (
                    <p className="mt-1 text-sm text-red-600">{errors.filingType.message}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register('isReturningClient')}
                      className="w-4 h-4 border-gray-300 rounded"
                      style={{ 
                        accentColor: primaryColor,
                      }}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      I am a returning client
                    </span>
                  </label>
                </div>
              </div>
            </FormStep>
          )}

          {/* Step 3: Income Types */}
          {currentStep === 3 && (
            <FormStep
              title="Income Types"
              description="Select all that apply to your situation."
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Income Sources *
                  </label>
                  <div className="space-y-2">
                    {INCOME_TYPE_OPTIONS.map((type) => (
                      <label key={type} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={watchedIncomeTypes.includes(type)}
                          onChange={(e) => handleIncomeTypeChange(type, e.target.checked)}
                          className="w-4 h-4 border-gray-300 rounded"
                          style={{ 
                            accentColor: primaryColor,
                          }}
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                  {errors.incomeTypes && (
                    <p className="mt-2 text-sm text-red-600">{errors.incomeTypes.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="otherIncome" className="block text-sm font-medium text-gray-700 mb-1">
                    Other Income (optional)
                  </label>
                  <textarea
                    id="otherIncome"
                    {...register('otherIncome')}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    style={{ 
                      '--tw-ring-color': primaryColor,
                    } as React.CSSProperties & { '--tw-ring-color': string }}
                    onFocus={(e) => {
                      e.target.style.borderColor = primaryColor
                      e.target.style.boxShadow = `0 0 0 2px ${primaryColor}40`
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = ''
                      e.target.style.boxShadow = ''
                    }}
                    placeholder="Describe any other income sources..."
                  />
                </div>

                {!watchedIncomeTypes.length && !watchedOtherIncome && (
                  <p className="text-sm text-red-600">
                    Please select at least one income type or describe other income.
                  </p>
                )}
              </div>
            </FormStep>
          )}

          {/* Step 4: Document Upload (or analyzing overlay) */}
          {currentStep === 4 && (
            <>
              {isAnalyzing ? (
                <FormStep
                  title="Analyzing your documents"
                  description="Building your quick snapshot—usually 30–60 seconds."
                >
                  <div className="py-12 flex flex-col items-center justify-center text-center max-w-md mx-auto">
                    <div className="relative mb-8">
                      <div
                        className="w-20 h-20 rounded-full border-4 border-gray-200 border-t-filingiq-blue animate-spin"
                        style={{ borderTopColor: primaryColor }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-lg font-medium text-gray-800 mb-2">
                      Reviewing your W-2s, 1099s, and more
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      We're pulling out key numbers and spotting opportunities. You'll see a quick snapshot next.
                    </p>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full animate-pulse"
                        style={{
                          width: '50%',
                          backgroundColor: primaryColor,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                  </div>
                </FormStep>
              ) : (
                <FormStep
                  title="Upload Your Tax Documents"
                  description="Upload your tax documents (W-2s, 1099s, receipts, etc.). Our AI will analyze them to identify personalized tax strategies."
                >
                  <FileUpload
                    files={files}
                    onFilesChange={setFiles}
                    error={files.length === 0 ? 'Please upload at least one document' : undefined}
                  />
                  {files.length > 5 && (
                    <p className="mt-3 text-sm text-gray-500">
                      Analyzing many documents may take up to a minute. Results are tailored to your filing status when you continue.
                    </p>
                  )}
                </FormStep>
              )}
            </>
          )}

          {/* Step 5: AI Analysis Results (only if enabled) */}
          {currentStep === 5 && enableAIAnalysis && (
            <FormStep
              title="Quick snapshot"
              description="A peek at what we're seeing—your preparer will deliver a full strategy after you submit."
            >
              <StrategyInsights
                analyses={analysisResults}
                isLoading={isAnalyzing}
              />
            </FormStep>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 max-w-2xl mx-auto">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                >
                  ← Back
                </button>
              )}
            </div>
            <div>
              {currentStep < (enableAIAnalysis ? 5 : 4) ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentStep === 4 && enableAIAnalysis && isAnalyzing}
                  className="px-6 py-2 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  style={{ 
                    backgroundColor: primaryColor,
                    boxShadow: `0 4px 6px -1px ${primaryColor}40`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  {currentStep === 4 && enableAIAnalysis && isAnalyzing ? 'Analyzing...' : 'Next →'}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting || files.length === 0}
                  className="px-6 py-2 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  style={{ 
                    backgroundColor: primaryColor,
                    boxShadow: `0 4px 6px -1px ${primaryColor}40`,
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.opacity = '0.9'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1'
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              )}
            </div>
          </div>

          {currentStep === (enableAIAnalysis ? 5 : 4) && files.length > 0 && (() => {
            const totalSize = files.reduce((s, f) => s + f.size, 0)
            const overLimit = totalSize > 4 * 1024 * 1024
            return overLimit ? (
              <div className="mt-4 max-w-2xl mx-auto p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                Your total upload size is large. If submit fails, try fewer or smaller documents.
              </div>
            ) : null
          })()}
          {submitError && (
            <div className="mt-4 max-w-2xl mx-auto">
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {submitError}
              </p>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}

