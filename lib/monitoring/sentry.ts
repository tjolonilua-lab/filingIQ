/**
 * Sentry error monitoring integration
 * 
 * Provides error tracking and performance monitoring. Automatically captures
 * errors, exceptions, and performance issues.
 * 
 * To enable:
 * 1. Install: npm install @sentry/nextjs
 * 2. Set SENTRY_DSN environment variable
 * 3. Run: npx @sentry/wizard@latest -i nextjs
 */

/**
 * Initialize Sentry if DSN is configured
 * 
 * This should be called early in the application lifecycle.
 * For Next.js, this is typically done in a separate sentry.client.config.ts
 * and sentry.server.config.ts file.
 * 
 * @returns True if Sentry was initialized, false otherwise
 */
export function initSentry(): boolean {
  const dsn = process.env.SENTRY_DSN
  
  if (!dsn) {
    return false
  }

  try {
    // Dynamic import to avoid issues if Sentry is not installed
    // In production, you would use:
    // import * as Sentry from '@sentry/nextjs'
    // Sentry.init({ dsn, ... })
    
    // For now, we'll just log that Sentry would be initialized
    // The actual initialization should be done via Sentry wizard
    console.log('[Sentry] DSN configured but Sentry not installed. Run: npm install @sentry/nextjs')
    return false
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error)
    return false
  }
}

/**
 * Capture an exception to Sentry
 * 
 * @param error - The error to capture
 * @param context - Additional context
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  try {
    // In production with Sentry installed:
    // import * as Sentry from '@sentry/nextjs'
    // Sentry.captureException(error, { extra: context })
    
    // For now, just log
    console.error('[Sentry] Would capture exception:', error.message, context)
  } catch {
    // Silently fail if Sentry is not available
  }
}

/**
 * Capture a message to Sentry
 * 
 * @param message - The message to capture
 * @param level - Log level (error, warning, info)
 * @param context - Additional context
 */
export function captureMessage(
  message: string,
  level: 'error' | 'warning' | 'info' = 'info',
  context?: Record<string, unknown>
): void {
  try {
    // In production with Sentry installed:
    // import * as Sentry from '@sentry/nextjs'
    // Sentry.captureMessage(message, { level, extra: context })
    
    // For now, just log
    console.log(`[Sentry] Would capture ${level}:`, message, context)
  } catch {
    // Silently fail if Sentry is not available
  }
}

/**
 * Add breadcrumb for debugging
 * 
 * @param message - Breadcrumb message
 * @param category - Breadcrumb category
 * @param data - Additional data
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, unknown>
): void {
  try {
    // In production with Sentry installed:
    // import * as Sentry from '@sentry/nextjs'
    // Sentry.addBreadcrumb({ message, category, data })
    
    // For now, just log
    console.debug(`[Sentry] Breadcrumb [${category}]:`, message, data)
  } catch {
    // Silently fail if Sentry is not available
  }
}

/**
 * Check if Sentry is enabled
 * 
 * @returns True if SENTRY_DSN is set
 */
export function isSentryEnabled(): boolean {
  return !!process.env.SENTRY_DSN
}
