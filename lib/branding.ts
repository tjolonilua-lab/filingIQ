/**
 * Business Branding Configuration
 * This allows each business to customize their branding
 * Set via environment variables
 */

export interface BusinessBranding {
  businessName: string
  businessEmail: string
  businessPhone: string
  businessWebsite: string
  mainWebsiteUrl?: string
  primaryColor: string
  secondaryColor?: string
  accentColor: string
}

/**
 * Get business branding configuration
 * 
 * Returns branding settings from environment variables with sensible defaults.
 * Used throughout the application for consistent branding.
 * 
 * @returns Business branding configuration object
 * 
 * @example
 * ```typescript
 * const branding = getBusinessBranding()
 * // Use branding.primaryColor, branding.businessName, etc.
 * ```
 */
export function getBusinessBranding(): BusinessBranding {
  return {
    businessName: process.env.BUSINESS_NAME || 'Tax Services',
    businessEmail: process.env.BUSINESS_EMAIL || 'info@example.com',
    businessPhone: process.env.BUSINESS_PHONE || '(555) 123-4567',
    businessWebsite: process.env.BUSINESS_WEBSITE || 'www.example.com',
    mainWebsiteUrl: process.env.MAIN_WEBSITE_URL,
    primaryColor: process.env.PRIMARY_COLOR || '#1e3a5f', // Navy
    secondaryColor: process.env.SECONDARY_COLOR,
    accentColor: process.env.ACCENT_COLOR || '#22c55e', // Green
  }
}

