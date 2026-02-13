/**
 * Environment variable validation
 * Validates required environment variables at startup
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface EnvConfig {
  // Required for production
  POSTGRES_URL?: string
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
  AWS_S3_BUCKET?: string
  AWS_REGION?: string
  
  // Optional but recommended
  RESEND_API_KEY?: string
  OPENAI_API_KEY?: string
  
  // Application config
  NODE_ENV?: string
  ADMIN_PASSWORD?: string
  LOG_LEVEL?: string
}

const requiredInProduction = [
  'POSTGRES_URL',
] as const

const recommended = [
  'RESEND_API_KEY',
  'OPENAI_API_KEY',
] as const

export function validateEnvironment(): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const isProduction = process.env.NODE_ENV === 'production'

  // Check required variables in production
  if (isProduction) {
    for (const key of requiredInProduction) {
      if (!process.env[key]) {
        errors.push(`Required environment variable missing: ${key}`)
      }
    }
  }

  // Check recommended variables
  for (const key of recommended) {
    if (!process.env[key]) {
      warnings.push(`Recommended environment variable missing: ${key}`)
    }
  }

  // Validate specific formats
  if (process.env.POSTGRES_URL && !process.env.POSTGRES_URL.startsWith('postgres://')) {
    warnings.push('POSTGRES_URL should start with postgres://')
  }

  if (process.env.LOG_LEVEL && !['debug', 'info', 'warn', 'error'].includes(process.env.LOG_LEVEL)) {
    warnings.push('LOG_LEVEL should be one of: debug, info, warn, error')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Get environment variable with validation
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue
  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set`)
  }
  return value
}

/**
 * Get optional environment variable
 */
export function getOptionalEnv(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue
}
