import { neon } from '@neondatabase/serverless'

/**
 * Database client initialization
 * Uses POSTGRES_URL environment variable (automatically set by Vercel when using Neon)
 */
export const sql = process.env.POSTGRES_URL ? neon(process.env.POSTGRES_URL) : null

/**
 * Check if database is available
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  if (!sql) {
    return false
  }
  
  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    return false
  }
}
