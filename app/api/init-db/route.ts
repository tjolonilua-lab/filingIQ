import { NextResponse } from 'next/server'
import { initDatabase } from '@/lib/db'
import { logger } from '@/lib/logger'
import { serverError, okResponse } from '@/lib/api'

/**
 * Initialize database tables
 * Call this once after setting up Neon Postgres
 * GET /api/init-db
 */
export async function GET() {
  try {
    // Check if POSTGRES_URL is set
    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        {
          success: false,
          error: 'POSTGRES_URL environment variable is not set. Please create a Neon Postgres database in Vercel.',
          hint: 'Go to your Vercel project → Storage → Create Database → Neon Postgres',
        },
        { status: 500 }
      )
    }

    await initDatabase()
    return okResponse({
      message: 'Database initialized successfully',
      tables: ['accounts', 'submissions', 'password_reset_tokens'],
    })
  } catch (error) {
    logger.error('Database initialization error', error as Error)
    return serverError(
      error instanceof Error ? error.message : 'Failed to initialize database',
      error instanceof Error ? error.stack : undefined
    )
  }
}
