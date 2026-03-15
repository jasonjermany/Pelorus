import type { ExtractedFact, Rule } from '~/types/models'
import { extractFactsWithClaude, generateRulesWithClaude } from './anthropic'

function hasAnthropicKey() {
  const config = useRuntimeConfig()
  return Boolean(config.anthropicApiKey)
}

export async function generateRulesFromGuidelines(guidelineText: string): Promise<Rule[]> {
  if (!hasAnthropicKey()) {
    throw new Error('ANTHROPIC_API_KEY is required to generate rules.')
  }

  return generateRulesWithClaude(guidelineText)
}

export async function extractFactsFromSubmission(submissionText: string, rules: Rule[]): Promise<ExtractedFact[]> {
  if (!hasAnthropicKey()) {
    throw new Error('ANTHROPIC_API_KEY is required to extract facts.')
  }

  return extractFactsWithClaude(submissionText, rules)
}
