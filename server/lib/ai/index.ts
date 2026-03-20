import type { Rule } from '~/types/models'
import { generateRulesFromGuidelineChunks, extractFactsWithClaude, type FactExtractionResult } from './anthropic'

function hasAnthropicKey() {
  const config = useRuntimeConfig()
  return Boolean(config.anthropicApiKey)
}

/**
 * Pelorus uses a hybrid schema:
 * - dynamic rule + fact model
 * - optional fact catalog for normalization
 * - AI performs mapping between raw text and canonical fact keys
 *
 * This supports carrier-specific flexibility while improving naming consistency.
 */
export async function generateRulesFromGuidelines(guidelineText: string): Promise<Rule[]> {
  if (!hasAnthropicKey()) {
    throw new Error('ANTHROPIC_API_KEY is required to generate rules.')
  }

  return generateRulesFromGuidelineChunks([guidelineText])
}

export async function extractFactsFromSubmission(submissionText: string, rules: Rule[]): Promise<FactExtractionResult> {
  if (!hasAnthropicKey()) {
    throw new Error('ANTHROPIC_API_KEY is required to extract facts.')
  }

  return extractFactsWithClaude(submissionText, rules)
}
