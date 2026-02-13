import { Resend } from 'resend'
import type { IntakeSubmission } from './validation'
import { getBusinessBranding } from './branding'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendIntakeEmail(
  intake: IntakeSubmission,
  fileLinks: string[],
  analysisSummary?: string | null
): Promise<void> {
  const branding = getBusinessBranding()
  const fromEmail = process.env.RESEND_FROM_EMAIL || `noreply@${branding.businessWebsite}`
  const toEmail = process.env.RESEND_TO_EMAIL || branding.businessEmail

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
      console.log('✅ Intake email sent via Resend')
      return
    } catch (error) {
      console.error('❌ Resend email failed:', error)
      // Fall through to console logging
    }
  }

  // Fallback: log to console
  console.log('\n' + '='.repeat(80))
  console.log('📧 NEW INTAKE SUBMISSION - EMAIL NOTIFICATION')
  console.log('='.repeat(80))
  console.log(`To: ${toEmail}`)
  console.log(`From: ${fromEmail}`)
  console.log(`Subject: New Tax Intake Submission - ${intake.contactInfo.fullName}`)
  console.log('\n--- Email Content ---\n')
  console.log(emailContent)
  console.log('\n' + '='.repeat(80) + '\n')
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

export async function sendPasswordResetEmail(
  email: string,
  companyName: string,
  token: string
): Promise<void> {
  const branding = getBusinessBranding()
  const fromEmail = process.env.RESEND_FROM_EMAIL || `noreply@${branding.businessWebsite}`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || 'http://localhost:3000'
  const resetUrl = `${siteUrl}/reset-password?token=${token}`

  const emailContent = formatPasswordResetEmailContent(companyName, resetUrl)

  // Try Resend if configured
  if (resend) {
    try {
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: 'Reset Your FilingIQ Password',
        html: emailContent,
      })
      console.log('✅ Password reset email sent via Resend')
      return
    } catch (error) {
      console.error('❌ Resend email failed:', error)
      // Fall through to console logging
    }
  }

  // Fallback: log to console
  console.log('\n' + '='.repeat(80))
  console.log('📧 PASSWORD RESET EMAIL')
  console.log('='.repeat(80))
  console.log(`To: ${email}`)
  console.log(`From: ${fromEmail}`)
  console.log(`Subject: Reset Your FilingIQ Password`)
  console.log('\n--- Email Content ---\n')
  console.log(emailContent)
  console.log(`\nReset URL: ${resetUrl}`)
  console.log('\n' + '='.repeat(80) + '\n')
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
