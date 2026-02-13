/**
 * Application-wide constants
 * Single source of truth for configuration values
 */

// File Upload Limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB in bytes
export const MAX_FILES_PER_UPLOAD = 10
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'text/plain',
]

// Password Requirements
export const MIN_PASSWORD_LENGTH = 6
export const PASSWORD_HASH_ROUNDS = 10 // bcrypt rounds

// Token Expiration
export const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1
export const PASSWORD_RESET_TOKEN_EXPIRY_MS = PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000

// Slug Requirements
export const MIN_SLUG_LENGTH = 2
export const MAX_SLUG_LENGTH = 50
export const SLUG_REGEX = /^[a-z0-9-]+$/

// Reserved Slugs (cannot be used by users)
export const RESERVED_SLUGS = [
  'admin',
  'api',
  'dashboard',
  'login',
  'signup',
  'forgot-password',
  'reset-password',
  'intake',
  'thank-you',
  'start',
  'config',
  'download',
  'analyze',
  'submissions',
  'init-db',
]

// Default Values
export const DEFAULT_ADMIN_PASSWORD = 'admin123'
export const DEFAULT_SITE_URL = 'http://localhost:3000'
export const DEFAULT_WEBSITE = 'example.com'
export const DEFAULT_COMPANY_NAME = 'Test Company'

// AI Analysis Configuration
export const OPENAI_MAX_TOKENS = 2000
export const OPENAI_TEMPERATURE = 0.1
export const OPENAI_DEFAULT_MODEL = 'gpt-4o'

// API Response Messages
export const API_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  UNAUTHORIZED: 'Not authenticated',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  SLUG_ALREADY_EXISTS: 'Slug already taken',
  INVALID_CREDENTIALS: 'Invalid email or password',
  PASSWORD_RESET_SENT: 'If an account with that email exists, a password reset link has been sent.',
  PASSWORD_RESET_INVALID: 'Invalid or expired reset token',
  PASSWORD_RESET_SUCCESS: 'Password reset successfully',
} as const

// Error Codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  EMAIL_ERROR: 'EMAIL_ERROR',
  AI_ANALYSIS_ERROR: 'AI_ANALYSIS_ERROR',
} as const
