import { NextRequest } from 'next/server'
import { createAccount } from '@/lib/accounts'
import { z } from 'zod'
import { handleApiError, handleZodError, createdResponse, sanitizeAccount } from '@/lib/api'
import { MIN_SLUG_LENGTH, MAX_SLUG_LENGTH, SLUG_REGEX, MIN_PASSWORD_LENGTH } from '@/lib/constants'
import { withRateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit'

const signupSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  website: z.string().url('Invalid website URL'),
  slug: z.union([
    z.string()
      .min(MIN_SLUG_LENGTH, `Slug must be at least ${MIN_SLUG_LENGTH} characters`)
      .max(MAX_SLUG_LENGTH, `Slug must be less than ${MAX_SLUG_LENGTH} characters`)
      .regex(SLUG_REGEX, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    z.literal(''), // Allow empty string, backend will generate
  ]).optional(),
})

const signupHandler = async (request: NextRequest) => {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = signupSchema.parse(body)
    
    // Normalize slug - if empty or invalid, let backend generate it
    const slug = validated.slug && validated.slug.trim().length >= MIN_SLUG_LENGTH 
      ? validated.slug.trim().toLowerCase()
      : undefined
    
    // Create account
    const account = await createAccount({
      companyName: validated.companyName,
      email: validated.email,
      password: validated.password,
      website: validated.website,
      slug: slug,
    })

    // Return account (without password hash)
    return createdResponse({ account: sanitizeAccount(account) })
  } catch (error) {
    // Log the error for debugging
    console.error('Signup error:', error)
    
    const zodError = handleZodError(error)
    if (zodError) return zodError
    
    // Handle API errors with better error messages
    return handleApiError(error)
  }
}

// No rate limiting for signup - validation errors shouldn't count as attempts
// Only login needs strict rate limiting for security
export const POST = signupHandler
