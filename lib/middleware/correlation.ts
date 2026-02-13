import { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { logger } from '../logger'

/**
 * Correlation ID utilities for request tracing
 * 
 * Correlation IDs help track requests across distributed systems and
 * make debugging easier by allowing you to trace a request through
 * all logs and services.
 */

/**
 * Get correlation ID from request headers or generate a new one
 * 
 * Checks for existing correlation ID in X-Correlation-Id header.
 * If not found, generates a new UUID v4.
 * 
 * @param request - The Next.js request object
 * @returns The correlation ID (existing or newly generated)
 * 
 * @example
 * ```typescript
 * const correlationId = getCorrelationId(request)
 * logger.info('Request started', { correlationId })
 * ```
 */
export function getCorrelationId(request: NextRequest): string {
  const existing = request.headers.get('x-correlation-id')
  if (existing) {
    return existing
  }
  
  const newId = randomUUID()
  return newId
}

/**
 * Middleware wrapper that adds correlation ID to requests and responses
 * 
 * Automatically:
 * - Extracts or generates correlation ID
 * - Adds it to request headers
 * - Includes it in all logs
 * - Adds it to response headers
 * 
 * @param handler - The API route handler function
 * @returns A wrapped handler with correlation ID support
 * 
 * @example
 * ```typescript
 * export const POST = withCorrelationId(async (req, correlationId) => {
 *   logger.info('Processing request', { correlationId })
 *   // ... handler logic
 *   return okResponse({ data })
 * })
 * ```
 */
export function withCorrelationId(
  handler: (req: NextRequest, correlationId: string) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    const correlationId = getCorrelationId(req)
    
    // Add correlation ID to request headers for downstream use
    req.headers.set('x-correlation-id', correlationId)
    
    // Log request start
    logger.info('Request started', {
      correlationId,
      method: req.method,
      path: req.nextUrl.pathname,
      query: Object.fromEntries(req.nextUrl.searchParams),
    })
    
    try {
      const response = await handler(req, correlationId)
      
      // Add correlation ID to response headers
      response.headers.set('x-correlation-id', correlationId)
      
      // Log request completion
      logger.info('Request completed', {
        correlationId,
        method: req.method,
        path: req.nextUrl.pathname,
        status: response.status,
      })
      
      return response
    } catch (error) {
      // Log request error
      logger.error('Request failed', error as Error, {
        correlationId,
        method: req.method,
        path: req.nextUrl.pathname,
      })
      
      // Re-throw to let Next.js handle it
      throw error
    }
  }
}

/**
 * Get correlation ID from AsyncLocalStorage context
 * 
 * This allows accessing the correlation ID from anywhere in the request
 * without passing it explicitly. Requires AsyncLocalStorage setup.
 * 
 * @returns The correlation ID for the current request, or undefined
 */
export function getCorrelationIdFromContext(): string | undefined {
  // This would require AsyncLocalStorage setup in middleware
  // For now, returns undefined - can be enhanced later
  return undefined
}
