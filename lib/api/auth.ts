import { NextRequest } from 'next/server'
import { DEFAULT_ADMIN_PASSWORD } from '@/lib/constants'

/**
 * API authentication utilities
 */

/**
 * Get account ID from request headers
 */
export function getAccountId(request: NextRequest): string | null {
  return request.headers.get('X-Account-Id')
}

/**
 * Verify admin password authentication
 * Used for legacy admin routes
 */
export function verifyAdminAuth(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) return false
  
  const token = authHeader.replace('Bearer ', '')
  return token === adminPassword
}

/**
 * Require account ID in request headers
 * 
 * Extracts the account ID from the X-Account-Id header and throws an error
 * if it's missing. Use this for routes that require authentication.
 * 
 * @param request - The Next.js request object
 * @returns The account ID from the request header
 * @throws {Error} If account ID is missing
 * 
 * @example
 * ```typescript
 * try {
 *   const accountId = requireAccountId(request)
 *   const account = await findAccountById(accountId)
 * } catch (error) {
 *   return unauthorizedError()
 * }
 * ```
 */
export function requireAccountId(request: NextRequest): string {
  const accountId = getAccountId(request)
  
  if (!accountId) {
    throw new Error('Account ID required')
  }
  
  return accountId
}

/**
 * Get account ID from query params or headers
 */
export function getAccountIdFromRequest(request: NextRequest): string | null {
  return (
    request.headers.get('X-Account-Id') ||
    request.nextUrl.searchParams.get('accountId') ||
    null
  )
}
