/**
 * Client-side logger utility
 * For use in React components (client-side only)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.isDevelopment && level === 'debug') {
      return // Don't log debug in production
    }

    const timestamp = new Date().toISOString()
    const logEntry = {
      level,
      message,
      timestamp,
      ...(context && { context }),
      ...(error && { error: error.message, stack: error.stack }),
    }

    // In production, you might want to send to a logging service
    // For now, we'll use console but with structured format
    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.debug(`[${timestamp}] [DEBUG]`, message, context)
        break
      case 'info':
        console.info(`[${timestamp}] [INFO]`, message, context)
        break
      case 'warn':
        console.warn(`[${timestamp}] [WARN]`, message, context)
        break
      case 'error':
        console.error(`[${timestamp}] [ERROR]`, message, error, context)
        break
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error)
  }
}

export const clientLogger = new ClientLogger()
