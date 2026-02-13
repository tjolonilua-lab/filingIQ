/**
 * Input sanitization utilities
 * Prevents XSS and injection attacks
 */

/**
 * Sanitize string input - removes potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .slice(0, 10000) // Limit length
}

/**
 * Sanitize email - validates and sanitizes email addresses
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return ''
  }

  const sanitized = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format')
  }

  return sanitized.slice(0, 255) // Limit length
}

/**
 * Sanitize URL - validates and sanitizes URLs
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return ''
  }

  const sanitized = url.trim()
  
  try {
    const parsed = new URL(sanitized)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Invalid URL protocol')
    }
    return sanitized.slice(0, 2048) // Limit length
  } catch {
    throw new Error('Invalid URL format')
  }
}

/**
 * Sanitize filename - removes dangerous characters from filenames
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') {
    return 'file'
  }

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace dangerous chars
    .replace(/\.\./g, '_') // Prevent path traversal
    .slice(0, 255) // Limit length
}

/**
 * Sanitize object - recursively sanitizes string values in an object
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj }
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key] as string) as T[Extract<keyof T, string>]
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key] as Record<string, unknown>) as T[Extract<keyof T, string>]
    }
  }
  
  return sanitized
}
