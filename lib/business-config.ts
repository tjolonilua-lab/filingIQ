/**
 * Business-level configuration
 * This determines which features are enabled for the business owner
 * Set via environment variables
 */

/**
 * Check if AI analysis is enabled for this business
 * 
 * Determines whether AI-powered document analysis features are available.
 * Controlled by ENABLE_AI_ANALYSIS environment variable.
 * 
 * @returns True if AI analysis is enabled, false otherwise
 * 
 * @example
 * ```typescript
 * if (isAIAnalysisEnabled()) {
 *   const analysis = await analyzeDocuments(documents)
 * }
 * ```
 */
export function isAIAnalysisEnabled(): boolean {
  // Check if business has purchased AI-enabled version
  // This would typically come from a database or subscription service
  // For now, we'll use an environment variable
  return process.env.ENABLE_AI_ANALYSIS === 'true'
}

/**
 * Get business configuration
 * 
 * Returns the full business configuration including feature flags.
 * 
 * @returns Business configuration object with enabled features
 * 
 * @example
 * ```typescript
 * const config = getBusinessConfig()
 * // config.aiAnalysisEnabled, config.version
 * ```
 */
export function getBusinessConfig(): { aiAnalysisEnabled: boolean; version: 'full' | 'lite' } {
  return {
    aiAnalysisEnabled: isAIAnalysisEnabled(),
    version: isAIAnalysisEnabled() ? 'full' : 'lite',
  }
}

