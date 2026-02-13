/**
 * Centralized logging utility
 * 
 * Replaces console.log/error/warn with structured logging that:
 * - Supports different log levels (debug, info, warn, error)
 * - Includes timestamps and context
 * - Can be extended to send to external services
 * - Respects environment-based log levels
 * 
 * @example
 * ```typescript
 * logger.info('User logged in', { userId: '123' })
 * logger.error('Database error', error, { query: 'SELECT * FROM users' })
 * ```
 */

import { captureException, captureMessage, addBreadcrumb, isSentryEnabled } from './monitoring/sentry'

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.logLevel)
  }

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    const errorStr = error ? ` Error: ${error.message}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}${errorStr}`
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    }

    const formatted = this.formatMessage(entry)

    // Add breadcrumb for Sentry
    if (isSentryEnabled()) {
      addBreadcrumb(message, level, { ...context, error: error?.message })
    }

    // Log to console with structured format
    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.debug(formatted)
        break
      case 'info':
        console.info(formatted)
        break
      case 'warn':
        console.warn(formatted)
        // Send warnings to Sentry
        if (isSentryEnabled()) {
          captureMessage(message, 'warning', context)
        }
        break
      case 'error':
        console.error(formatted, error?.stack || '')
        // Send errors to Sentry
        if (isSentryEnabled() && error) {
          captureException(error, context)
        } else if (isSentryEnabled()) {
          captureMessage(message, 'error', context)
        }
        break
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error)
  }
}

export const logger = new Logger()
