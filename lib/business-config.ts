/**
 * Business-level configuration
 * This determines which features are enabled for the business owner
 * Set via environment variables
 */

export function isAIAnalysisEnabled(): boolean {
  // Check if business has purchased AI-enabled version
  // This would typically come from a database or subscription service
  // For now, we'll use an environment variable
  return process.env.ENABLE_AI_ANALYSIS === 'true'
}

export function getBusinessConfig() {
  return {
    aiAnalysisEnabled: isAIAnalysisEnabled(),
    version: isAIAnalysisEnabled() ? 'full' : 'lite',
  }
}

