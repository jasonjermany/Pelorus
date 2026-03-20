import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const DEFAULT_MODEL = 'claude-3-5-sonnet-latest'

export function getClient() {
  const config = useRuntimeConfig()
  const apiKey = config.anthropicApiKey as string | undefined
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured.')
  return new Anthropic({ apiKey })
}

export function getModel() {
  const config = useRuntimeConfig()
  const model = config.anthropicModel as string | undefined
  return model || DEFAULT_MODEL
}

export async function callClaude<Schema extends z.ZodTypeAny>(
  client: Anthropic,
  model: string,
  maxTokens: number,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  jsonSchema: Record<string, unknown>,
  zodSchema: Schema,
): Promise<z.infer<Schema>> {
  const t0 = Date.now()
  const MAX_RETRIES = 4
  const RETRY_BASE_MS = 15_000 // 15s, 30s, 45s, 60s

  let response: Awaited<ReturnType<typeof client.messages.create>> | undefined
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature: 0,
        messages,
        output_config: {
          format: {
            type: 'json_schema',
            schema: jsonSchema,
          },
        },
      } as any)
      break
    } catch (err) {
      const is429 = (err as any)?.status === 429
      if (is429 && attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_MS * (attempt + 1)
        console.warn(`[claude] 429 rate limit (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay / 1000}s`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      console.error(`[claude] API call failed after ${Date.now() - t0}ms:`, err instanceof Error ? err.message : err)
      throw err
    }
  }

  console.log(`[claude] responded in ${Date.now() - t0}ms (model=${model} maxTokens=${maxTokens})`)

  if (!response) throw new Error('Claude call exhausted retries without a response.')

  const textBlock = (response.content as any[]).find((b) => b.type === 'text')
  if (!textBlock?.text) {
    console.error('[claude] no text block in response:', JSON.stringify(response))
    throw new Error(`Claude returned no text content. Response: ${JSON.stringify(response)}`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(textBlock.text)
  } catch (err) {
    console.error('[claude] JSON.parse failed on response text:', textBlock.text)
    throw new Error(`Claude response was not valid JSON: ${err instanceof Error ? err.message : err}`)
  }

  try {
    return zodSchema.parse(parsed)
  } catch (err) {
    console.error('[claude] Zod validation failed. Parsed value:', JSON.stringify(parsed))
    console.error('[claude] Zod error:', err)
    throw err
  }
}
