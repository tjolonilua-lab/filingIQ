import { NextResponse } from 'next/server'
import { API_MESSAGES } from '@/lib/constants'

/**
 * Standard API success responses
 * Provides consistent response formatting across all API routes
 */

export interface ApiSuccess<T = unknown> {
  success: true
  message?: string
  data?: T
  [key: string]: unknown
}

export function createSuccessResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      ...(message && { message }),
      ...(data && { data }),
    },
    { status }
  )
}

/**
 * Create a successful 200 OK response
 * 
 * @param data - Optional data to include in the response
 * @param message - Optional success message
 * @returns A NextResponse with success: true and status 200
 * 
 * @example
 * ```typescript
 * return okResponse({ account: sanitizedAccount }, 'Account created successfully')
 * ```
 */
export function okResponse<T>(data?: T, message?: string): NextResponse<ApiSuccess<T>> {
  return createSuccessResponse(data, message, 200)
}

export function createdResponse<T>(data?: T, message?: string): NextResponse<ApiSuccess<T>> {
  return createSuccessResponse(data, message || API_MESSAGES.SUCCESS, 201)
}

/**
 * Remove sensitive fields from account objects before sending to client
 * 
 * Removes passwordHash and any other sensitive fields from account objects
 * to prevent accidental exposure in API responses.
 * 
 * @param account - The account object to sanitize
 * @returns A new account object without sensitive fields
 * 
 * @example
 * ```typescript
 * const account = await findAccountById(id)
 * return okResponse({ account: sanitizeAccount(account) })
 * ```
 */
export function sanitizeAccount<T extends { passwordHash?: string }>(account: T): Omit<T, 'passwordHash'> {
  const { passwordHash, ...sanitized } = account
  return sanitized
}
