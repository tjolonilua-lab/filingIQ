'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  useEffect(() => {
    // Redirect to admin dashboard
    // The admin dashboard should handle client detail view
    router.replace('/admin')
  }, [clientId, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-filingiq-blue"></div>
    </div>
  )
}
