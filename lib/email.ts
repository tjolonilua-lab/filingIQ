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

