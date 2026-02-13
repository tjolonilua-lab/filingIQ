/**
 * Analytics integration
 * 
 * Provides user analytics tracking. Currently supports:
 * - PostHog (recommended)
 * - Mixpanel
 * - Google Analytics 4
 * 
 * To enable, install the analytics package and set the appropriate environment variables.
 * 
 * @example
 * ```typescript
 * import { trackEvent } from '@/lib/analytics'
 * trackEvent('user_signed_up', { accountId: '123' })
 * ```
 */

// PostHog integration
type PostHog = {
  init: (key: string, options: { api_host?: string; loaded?: (posthog: PostHog) => void }) => void
  capture: (eventName: string, properties?: Record<string, unknown>) => void
  identify: (userId: string, properties?: Record<string, unknown>) => void
  setPersonProperties: (properties: Record<string, unknown>) => void
  debug: () => void
}
let posthog: PostHog | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  posthog = require('posthog-js')
} catch {
  // PostHog not installed
}

// Mixpanel integration
type Mixpanel = {
  init: (token: string, options: { debug?: boolean }) => void
  track: (eventName: string, properties?: Record<string, unknown>) => void
  identify: (userId: string) => void
  people: {
    set: (properties: Record<string, unknown>) => void
  }
}
let mixpanel: Mixpanel | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mixpanel = require('mixpanel-browser')
} catch {
  // Mixpanel not installed
}

/**
 * Initialize analytics (client-side only)
 * 
 * Call this in a client component's useEffect
 * 
 * @example
 * ```typescript
 * useEffect(() => {
 *   initAnalytics()
 * }, [])
 * ```
 */
export function initAnalytics(): void {
  // Initialize PostHog
  if (posthog && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') {
          ph.debug()
        }
      },
    })
  }

  // Initialize Mixpanel
  if (mixpanel && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
    mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!, {
      debug: process.env.NODE_ENV === 'development',
    })
  }
}

/**
 * Track an event
 * 
 * Sends event to all configured analytics providers
 * 
 * @param eventName - Name of the event
 * @param properties - Event properties/context
 * 
 * @example
 * ```typescript
 * trackEvent('user_signed_up', { 
 *   accountId: '123',
 *   companyName: 'Acme Corp'
 * })
 * ```
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  // Track in PostHog
  if (posthog && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    try {
      posthog.capture(eventName, properties)
    } catch (error) {
      console.error('PostHog tracking error:', error)
    }
  }

  // Track in Mixpanel
  if (mixpanel && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
    try {
      mixpanel.track(eventName, properties)
    } catch (error) {
      console.error('Mixpanel tracking error:', error)
    }
  }
}

/**
 * Identify a user
 * 
 * Associates events with a specific user
 * 
 * @param userId - Unique user identifier
 * @param properties - User properties
 * 
 * @example
 * ```typescript
 * identifyUser('user-123', {
 *   email: 'user@example.com',
 *   companyName: 'Acme Corp'
 * })
 * ```
 */
export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>
): void {
  // Identify in PostHog
  if (posthog && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    try {
      posthog.identify(userId, properties)
    } catch (error) {
      console.error('PostHog identify error:', error)
    }
  }

  // Identify in Mixpanel
  if (mixpanel && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
    try {
      mixpanel.identify(userId)
      if (properties) {
        mixpanel.people.set(properties)
      }
    } catch (error) {
      console.error('Mixpanel identify error:', error)
    }
  }
}

/**
 * Set user properties
 * 
 * Updates properties for the current user
 * 
 * @param properties - User properties to set
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  // Set in PostHog
  if (posthog && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    try {
      posthog.setPersonProperties(properties)
    } catch (error) {
      console.error('PostHog set properties error:', error)
    }
  }

  // Set in Mixpanel
  if (mixpanel && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
    try {
      mixpanel.people.set(properties)
    } catch (error) {
      console.error('Mixpanel set properties error:', error)
    }
  }
}

/**
 * Check if analytics is enabled
 */
export function isAnalyticsEnabled(): boolean {
  return !!(
    (posthog && process.env.NEXT_PUBLIC_POSTHOG_KEY) ||
    (mixpanel && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN)
  )
}
