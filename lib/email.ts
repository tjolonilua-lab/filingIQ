import { Resend } from 'resend'
import type { IntakeSubmission } from './validation'
import { getBusinessBranding } from './branding'
import { logger } from './logger'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

/**
 * Send intake submission email notification
 * 
 * Sends an email notification when a new tax intake submission is received.
 * Uses Resend if configured, otherwise logs to console (development).
 * 
 * @param intake - The intake submission data
 * @param fileLinks - Array of file URLs/paths to include in email
 * @param analysisSummary - Optional AI analysis summary to include
 * @param accountEmail - Optional account owner email (if provided, sends to account owner)
 * @returns Promise that resolves when email is sent or logged
 * 
 * @example
 * ```typescript
 * await sendIntakeEmail(intake, fileLinks, analysisSummary, accountEmail)
 * ```
 */
export async function sendIntakeEmail(
  intake: IntakeSubmission,
  fileLinks: string[],
  analysisSummary?: string | null,
  accountEmail?: string
): Promise<void> {
  const branding = getBusinessBranding()
  const fromEmail = process.env.RESEND_FROM_EMAIL || `noreply@${branding.businessWebsite}`
  // Send to account owner's email if provided, otherwise fallback to RESEND_TO_EMAIL or BUSINESS_EMAIL
  const toEmail = accountEmail || process.env.RESEND_TO_EMAIL || branding.businessEmail

  const emailContent = formatEmailContent(intake, fileLinks, analysisSummary)

  // Try Resend if configured
  if (resend) {
    try {
      await resend.emails.send({
        from: fromEmail,
        to: toEmail,
        subject: `New Tax Intake Submission - ${intake.contactInfo.fullName}`,
        html: emailContent,
      })
      logger.info('Intake email sent via Resend', { to: toEmail, from: fromEmail })
      return
    } catch (error) {
      logger.error('Resend email failed', error as Error, { to: toEmail })
      // Fall through to logger
    }
  }

  // Fallback: log to logger (for development/testing)
  logger.info('NEW INTAKE SUBMISSION - EMAIL NOTIFICATION', {
    to: toEmail,
    from: fromEmail,
    subject: `New Tax Intake Submission - ${intake.contactInfo.fullName}`,
    content: emailContent,
  })
}

function formatEmailContent(intake: IntakeSubmission, fileLinks: string[], analysisSummary?: string | null): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e3a5f; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
          .section { margin-bottom: 20px; }
          .label { font-weight: bold; color: #1e3a5f; }
          .files { margin-top: 10px; }
          .file-link { color: #22c55e; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Tax Intake Submission</h1>
          </div>
          <div class="content">
            <div class="section">
              <h2>Contact Information</h2>
              <p><span class="label">Name:</span> ${intake.contactInfo.fullName}</p>
              <p><span class="label">Email:</span> ${intake.contactInfo.email}</p>
              <p><span class="label">Phone:</span> ${intake.contactInfo.phone}</p>
            </div>
            
            <div class="section">
              <h2>Filing Information</h2>
              <p><span class="label">Filing Type:</span> ${intake.filingInfo.filingType}</p>
              <p><span class="label">Client Type:</span> ${intake.filingInfo.isReturningClient ? 'Returning Client' : 'New Client'}</p>
            </div>
            
            <div class="section">
              <h2>Income Types</h2>
              <ul>
                ${intake.incomeInfo.incomeTypes.map(type => `<li>${type}</li>`).join('')}
              </ul>
              ${intake.incomeInfo.otherIncome ? `<p><span class="label">Other Income:</span> ${intake.incomeInfo.otherIncome}</p>` : ''}
            </div>
            
            ${fileLinks.length > 0 ? `
            <div class="section">
              <h2>Uploaded Documents</h2>
              <div class="files">
                ${fileLinks.map(link => `<p><a href="${link}" class="file-link">${link}</a></p>`).join('')}
              </div>
            </div>
            ` : ''}
            
            ${analysisSummary ? `
            <div class="section" style="background-color: #e8f5e9; padding: 15px; border-left: 4px solid #22c55e; margin-top: 20px;">
              <h2 style="color: #1e3a5f; margin-top: 0;">🤖 AI Document Analysis</h2>
              <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 12px; background: white; padding: 10px; border-radius: 4px;">${analysisSummary}</pre>
            </div>
            ` : ''}
            
            <div class="section">
              <p><span class="label">Submitted:</span> ${new Date(intake.submittedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Send password reset email
 * 
 * Sends a password reset email with a secure token link. Uses Resend
 * if configured, otherwise logs to console (development).
 * 
 * @param email - The recipient email address
 * @param companyName - The company name for personalization
 * @param token - The password reset token
 * @returns Promise that resolves when email is sent or logged
 * 
 * @example
 * ```typescript
 * await sendPasswordResetEmail(userEmail, companyName, resetToken)
 * ```
 */
export async function sendPasswordResetEmail(
  email: string,
  companyName: string,
  token: string
): Promise<void> {
  const branding = getBusinessBranding()
  const fromEmail = process.env.RESEND_FROM_EMAIL || `noreply@${branding.businessWebsite}`
  
  // Build site URL - prefer production domain over preview URLs
  // Priority: NEXT_PUBLIC_SITE_URL > production VERCEL_URL > localhost
  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  
  // Only use VERCEL_URL if it's production (not a preview deployment)
  if (!siteUrl && process.env.VERCEL_ENV === 'production' && process.env.VERCEL_URL) {
    siteUrl = process.env.VERCEL_URL
  }
  
  // Fallback to localhost for development
  if (!siteUrl) {
    siteUrl = 'http://localhost:3000'
  }
  
  // Ensure URL has protocol
  if (siteUrl && !siteUrl.startsWith('http')) {
    siteUrl = `https://${siteUrl}`
  }
  
  // Remove trailing slash from siteUrl if present
  siteUrl = siteUrl.replace(/\/$/, '')
  
  // If VERCEL_SHARE_TOKEN is set, add it to bypass password protection
  // This allows password reset links to work even if deployment is password-protected
  const shareToken = process.env.VERCEL_SHARE_TOKEN
  const shareParam = shareToken ? `&_vercel_share=${shareToken}` : ''
  
  // Properly encode the token in the URL
  const resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(token)}${shareParam}`

  const emailContent = formatPasswordResetEmailContent(companyName, resetUrl)

  // Try Resend if configured
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Reset Your FilingIQ Password',
        html: emailContent,
      })
      logger.info('Password reset email sent via Resend', { 
        to: email, 
        from: fromEmail,
        messageId: result.data?.id || 'unknown',
        resetUrl 
      })
      return
    } catch (error) {
      // Log detailed error information
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
      logger.error('Resend email failed', error as Error, { 
        to: email, 
        from: fromEmail,
        errorDetails,
        resetUrl
      })
      // Re-throw so caller knows it failed
      throw error
    }
  }

  // Fallback: log to logger (for development/testing)
  logger.info('PASSWORD RESET EMAIL', {
    to: email,
    from: fromEmail,
    subject: 'Reset Your FilingIQ Password',
    resetUrl,
    content: emailContent,
  })
}

function formatPasswordResetEmailContent(companyName: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1e3a5f; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
          .button { display: inline-block; background-color: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background-color: #1ea548; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hello ${companyName},</p>
            <p>We received a request to reset your FilingIQ account password.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1e3a5f;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
            </div>
            <p>If you continue to have problems, please contact support.</p>
          </div>
          <div class="footer">
            <p>This is an automated message from FilingIQ. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
