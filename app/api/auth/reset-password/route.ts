import { NextRequest } from 'next/server'
import { hashPassword } from '@/lib/accounts'
import {
  validatePasswordResetTokenDB,
  markPasswordResetTokenUsedDB,
  updateAccountPasswordDB,
} from '@/lib/db'
import { z } from 'zod'
import { handleApiError, handleZodError, okResponse, validationError } from '@/lib/api'
import { API_MESSAGES, MIN_PASSWORD_LENGTH } from '@/lib/constants'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validated = resetPasswordSchema.parse(body)
    
    // Validate token
    const tokenData = await validatePasswordResetTokenDB(validated.token)
    
    if (!tokenData) {
      return validationError(API_MESSAGES.PASSWORD_RESET_INVALID)
    }
    
    // Hash new password
    const passwordHash = await hashPassword(validated.password)
    
    // Update password
    await updateAccountPasswordDB(tokenData.accountId, passwordHash)
    
    // Mark token as used
    await markPasswordResetTokenUsedDB(validated.token)
    
    return okResponse({}, API_MESSAGES.PASSWORD_RESET_SUCCESS)
  } catch (error) {
    const zodError = handleZodError(error)
    if (zodError) return zodError
    
    return handleApiError(error)
  }
}
