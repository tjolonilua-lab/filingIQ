import { NextResponse } from 'next/server'
import { ERROR_CODES, API_MESSAGES } from '@/lib/constants'

/**
 * Standard API error responses
 * Provides consistent error formatting across all API routes
 */

export interface ApiError {
  success: false
  error: string
  code?: string
  details?: unknown
}

export function createErrorResponse(
  message: string,
  status: number = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiError> {
  const response: ApiError = {
    success: false,
    error: message,
  }
  if (code) {
    response.code = code
  }
  if (details !== undefined) {
    response.details = details
  }
  return NextResponse.json(response, { status })
}

export function validationError(error: string): NextResponse<ApiError> {
  return createErrorResponse(
    error,
    400,
    ERROR_CODES.VALIDATION_ERROR
  )
}

export function unauthorizedError(message: string = API_MESSAGES.UNAUTHORIZED): NextResponse<ApiError> {
  return createErrorResponse(
    message,
    401,
    ERROR_CODES.AUTHENTICATION_ERROR
  )
}

export function forbiddenError(message: string = API_MESSAGES.FORBIDDEN): NextResponse<ApiError> {
  return createErrorResponse(
    message,
    403,
    ERROR_CODES.AUTHORIZATION_ERROR
  )
}

export function notFoundError(message: string = API_MESSAGES.NOT_FOUND): NextResponse<ApiError> {
  return createErrorResponse(
    message,
    404,
    ERROR_CODES.NOT_FOUND
  )
}

export function serverError(
  message: string = API_MESSAGES.SERVER_ERROR,
  details?: unknown
): NextResponse<ApiError> {
  return createErrorResponse(
    message,
    500,
    ERROR_CODES.DATABASE_ERROR,
    details
  )
}

/**
 * Handle Zod validation errors
 * 
 * @param error - The error to check (can be any type)
 * @returns A validation error response if the error is a ZodError, null otherwise
 * 
 * @example
 * ```typescript
 * try {
 *   const validated = schema.parse(data)
 * } catch (error) {
 *   const zodError = handleZodError(error)
 *   if (zodError) return zodError
 * }
 * ```
 */
export function handleZodError(error: unknown): NextResponse<ApiError> | null {
  // Dynamic import to avoid issues
  const { ZodError } = require('zod')
  
  if (error && typeof error === 'object' && error instanceof ZodError) {
    const zodError = error as { errors: Array<{ message: string }> }
    if (zodError.errors && zodError.errors.length > 0) {
      return validationError(zodError.errors[0].message)
    }
  }
  
  return null
}

/**
 * Handle common API errors with appropriate error responses
 * 
 * Automatically handles:
 * - Zod validation errors
 * - Database/filesystem errors
 * - Email/slug conflicts
 * - Generic errors
 * 
 * @param error - The error to handle (can be any type)
 * @returns A standardized error response with appropriate status code
 * 
 * @example
 * ```typescript
 * try {
 *   await someOperation()
 * } catch (error) {
 *   return handleApiError(error)
 * }
 * ```
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  // Try Zod error first
  const zodError = handleZodError(error)
  if (zodError) return zodError

  // Handle known error types
  if (error instanceof Error) {
    // Database/read-only filesystem errors
    if (
      error.message.includes('read-only') ||
      error.message.includes('EPERM') ||
      error.message.includes('EROFS')
    ) {
      return serverError(
        'Database configuration required. Please set POSTGRES_URL environment variable.',
        error.message
      )
    }

    // Email already exists
    if (error.message === 'Email already registered') {
      return createErrorResponse(
        API_MESSAGES.EMAIL_ALREADY_EXISTS,
        409,
        ERROR_CODES.VALIDATION_ERROR
      )
    }

    // Slug already exists
    if (error.message === 'Slug already taken') {
      return createErrorResponse(
        API_MESSAGES.SLUG_ALREADY_EXISTS,
        409,
        ERROR_CODES.VALIDATION_ERROR
      )
    }

    // Return error message
    return serverError(error.message)
  }

  // Unknown error
  return serverError(API_MESSAGES.SERVER_ERROR, error)
}
