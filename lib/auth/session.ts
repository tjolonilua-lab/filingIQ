import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { logger } from '../logger'

/**
 * Session management with httpOnly cookies
 * 
 * Provides secure session management using JWT tokens stored in httpOnly cookies.
 * This prevents XSS attacks by making tokens inaccessible to JavaScript.
 */

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'
const SESSION_DURATION_DAYS = 7

/**
 * Create a secure session for a user
 * 
 * Generates a JWT token and stores it in an httpOnly cookie. The token
 * contains the account ID and is signed with a secret key.
 * 
 * @param accountId - The account ID to create a session for
 * @returns Promise that resolves when session is created
 * 
 * @example
 * ```typescript
 * await createSession(account.id)
 * ```
 */
export async function createSession(accountId: string): Promise<void> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  
  const token = await new SignJWT({ accountId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_DAYS}d`)
    .sign(secret)

  const cookieStore = cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * SESSION_DURATION_DAYS, // 7 days
    path: '/',
  })

  logger.info('Session created', { accountId })
}

/**
 * Get the current session account ID
 * 
 * Validates the session token from cookies and returns the account ID
 * if the session is valid.
 * 
 * @returns The account ID if session is valid, null otherwise
 * 
 * @example
 * ```typescript
 * const accountId = await getSession()
 * if (!accountId) {
 *   return unauthorizedError()
 * }
 * ```
 */
export async function getSession(): Promise<string | null> {
  const cookieStore = cookies()
  const token = cookieStore.get('session')?.value
  
  if (!token) {
    return null
  }
  
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload.accountId as string
  } catch (error) {
    logger.warn('Invalid session token', { error: error instanceof Error ? error.message : 'Unknown error' })
    return null
  }
}

/**
 * Destroy the current session
 * 
 * Removes the session cookie, effectively logging out the user.
 * 
 * @returns Promise that resolves when session is destroyed
 * 
 * @example
 * ```typescript
 * await destroySession()
 * ```
 */
export async function destroySession(): Promise<void> {
  const cookieStore = cookies()
  cookieStore.delete('session')
  logger.info('Session destroyed')
}

/**
 * Require a valid session
 * 
 * Gets the current session and throws an error if no valid session exists.
 * Use this in API routes that require authentication.
 * 
 * @returns The account ID from the session
 * @throws {Error} If no valid session exists
 * 
 * @example
 * ```typescript
 * try {
 *   const accountId = await requireSession()
 *   // ... authenticated logic
 * } catch {
 *   return unauthorizedError()
 * }
 * ```
 */
export async function requireSession(): Promise<string> {
  const accountId = await getSession()
  if (!accountId) {
    throw new Error('No valid session')
  }
  return accountId
}
