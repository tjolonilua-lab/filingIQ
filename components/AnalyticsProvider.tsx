'use client'

import { useEffect } from 'react'
import { initAnalytics } from '@/lib/analytics'

/**
 * Analytics Provider Component
 * 
 * Initializes analytics tracking on the client side.
 * Add this to your root layout or app component.
 * 
 * @example
 * ```tsx
 * <AnalyticsProvider>
 *   {children}
 * </AnalyticsProvider>
 * ```
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize analytics when component mounts
    initAnalytics()
  }, [])

  return <>{children}</>
}
