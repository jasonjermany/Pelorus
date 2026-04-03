import Anthropic from '@anthropic-ai/sdk'
import { getRelevantChunks } from './rag'


const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'extended-cache-ttl-2025-04-11',
  },
})

const CHECKS_TOOL = {
  name: 'submit_evaluation',
  description: 'Submit the structured underwriting evaluation results after analyzing all checks.',
  input_schema: {
    type: 'object' as const,
    properties: {
      decision: {
        type: 'string',
        enum: ['PROCEED', 'REFER', 'DECLINE'],
        description: 'Overall underwriting decision based on the check results.',
      },
      guideline_checks: {
        type: 'array',
        description: 'Only include checks with status "review" or "fail". Omit passing checks entirely.',
        items: {
          type: 'object',
          properties: {
            rule: { type: 'string', description: 'Exact rule name from the mandatory check list.' },
            required: { type: 'string', description: 'What the guideline requires.' },
            submitted: { type: 'string', description: 'What the submission says.' },
            status: { type: 'string', enum: ['review', 'fail'] },
            cited_section: { type: 'string', description: 'Section or page reference.' },
          },
          required: ['rule', 'required', 'submitted', 'status', 'cited_section'],
        },
      },
    },
    required: ['decision', 'guideline_checks'],
  },
}

const HARD_STOP_RULES = `HARD STOP STATUS RULES — apply these to every check, no exceptions:

Assign "fail" when:
- The condition is explicitly confirmed present in any submitted document
- Any document mentions the condition existed, even if claimed remediated,
  unless this submission contains written professional certification of
  complete removal meeting program standards
- The submission discloses materials or systems from an era when the
  prohibited condition was common, without confirming the specific
  safe type currently present

Assign "review" when:
- The condition cannot be confirmed absent from all portions of all buildings
- Any system, material, or condition is described with vague language such
  as "original", "predating modern standards", "unconfirmed", or similar
- The submission does not explicitly address this condition at all
- Claimed remediation exists but written professional documentation
  confirming complete resolution is not included in this submission
- The building age or location creates reasonable risk that the condition
  may be present, even if not disclosed

Assign "pass" only when all of the following are true:
- The condition is explicitly confirmed absent from all portions of
  all buildings in the submission
- Confirmation comes from a named professional report, inspection
  certificate, or explicit documented statement
- No document in the submission mentions or implies the condition
  may have existed or currently exists

GENERAL RULES:
- "It was fixed" without supporting documentation = "review", not "pass"
- Any mention of a condition in any document = at minimum "review"
- Silence on a condition for an older building = "review", not "pass"
- Partial remediation of a building does not satisfy whole-building requirements
- Program approvals not yet obtained = "review", not "pass"
- Geographic or age-based risk factors warrant "review" even without
  explicit disclosure`

function buildChecksMessages(
  submissionText: string,
  hardStopsText: string,
  guidelinesText: string,
  hardStopCheckList: string,
  pinnedCount: number,
) {
  return [
    {
      role: 'user' as const,
      content: [
        {
          type: 'text' as const,
          text: `You are an expert commercial insurance underwriter evaluating broker submissions.

## HARD STOPS — carrier guidelines
${hardStopsText || '(none)'}

## RELEVANT GUIDELINES
${guidelinesText || '(none)'}

---

${HARD_STOP_RULES}

You MUST evaluate ALL of the following checks. These are derived from this carrier's actual guidelines.
Do not add checks. Do not remove checks. Do not rename checks. Evaluate every single one.

MANDATORY CHECKS — evaluate all ${pinnedCount} of these:
${hardStopCheckList}

For each check:
- status "pass" = clearly not present in submission
- status "review" = unclear or cannot confirm from submission
- status "fail" = confirmed present → triggers DECLINE or referral

Only include checks with status "review" or "fail" in guideline_checks.
Do NOT include passing checks — omit them entirely.

DECISION RULES — follow exactly, no judgment:
- If ANY guideline_check has status "fail" → decision MUST be "DECLINE"
- If ANY guideline_check has status "review" → decision MUST be "REFER"
- If ALL checks pass (guideline_checks is empty) → decision is "PROCEED"

Call the submit_evaluation tool with your results.`,
          cache_control: { type: 'ephemeral', ttl: '1h' } as any,
        },
        {
          type: 'text' as const,
          text: `## SUBMISSION TO EVALUATE\n${submissionText}`,
        },
      ],
    },
  ]
}


async function runInsightsCall(submissionText: string): Promise<any> {
  const prompt = `You are an expert commercial insurance underwriter analyzing a broker submission.

SUBMISSION:
${submissionText}

Return ONLY valid JSON, no markdown, no backticks:
{
  "insights": {
    "pattern_recognition": "<risk pattern analysis — 1-2 sentences>",
    "market_context": "<prior carrier and market context — 1-2 sentences>",
    "consistency_check": "<cross-document consistency observations — 1-2 sentences>",
    "coverage_gap": "<missing coverages or gaps — 1-2 sentences>"
  },
  "missing_info": [
    {
      "label": "<short label — 5 words max>",
      "description": "<1 sentence — what is needed and why>"
    }
  ]
}`
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 2000,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as any).text as string
  console.log(`[eval] call 2 output  ${text.length} chars (~${Math.round(text.length / 4)} tokens)`)
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    console.warn('[eval] insights call parse failed')
    return { insights: {}, missing_info: [] }
  }
}

async function runFlagsCall(
  submissionText: string,
  checksResult: { decision: string; guideline_checks: any[] },
): Promise<any> {
  const checksContext = JSON.stringify(checksResult, null, 2)

  const prompt = `You are an expert commercial insurance underwriter.

SUBMISSION:
${submissionText.slice(0, 10000)}

GUIDELINE CHECK RESULTS (already evaluated):
${checksContext}

Based on the submission and check results above, return ONLY valid JSON, no markdown, no backticks:
{
  "recommendation": {
    "summary": "<2 sentences explaining the decision>",
    "action_items": ["<specific action — 1 sentence each, max 4>"]
  },
  "flags": [
    {
      "title": "<short label — 6 words max>",
      "type": "CONDITION" | "VERIFY",
      "explanation": "<what the issue is — 2 sentences max>",
      "action_required": "<what underwriter must do — 1 sentence>",
      "cited_section": "<section reference>"
    }
  ],
  "favorable_factors": ["<positive finding — 1 sentence, max 4>"],
  "dimension_scores": {
    "construction": <0.0-10.0>,
    "fire_protection": <0.0-10.0>,
    "management": <0.0-10.0>,
    "submission_quality": <0.0-10.0>,
    "loss_history": <0.0-10.0>,
    "occupancy": <0.0-10.0>,
    "cat_exposure": <0.0-10.0>
  }
}

FLAG TYPE RULES — follow exactly:
- CONDITION = the corresponding guideline_check has status "fail"
- VERIFY = the corresponding guideline_check has status "review"
- Do not use your own judgment to upgrade or downgrade flag severity.
- The type MUST match the status of the corresponding check exactly.
- Only flag checks with status "fail" or "review" — never flag a "pass".
- flags: max 6 items`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3000,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as any).text as string
  console.log(`[eval] call 3 output  ${text.length} chars (~${Math.round(text.length / 4)} tokens)`)
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    console.error('[eval] flags call parse failed, last 300:', text.slice(-300))
    throw new Error('flags call JSON parse failed')
  }
}

async function runRiskProfileCall(submissionText: string, fields: string[]): Promise<Record<string, string>> {
  const schemaLines = fields.map((f) => `  "${f}": "<extracted value or 'Not disclosed'>"`).join(',\n')
  const prompt = `You are extracting structured data from an insurance submission.
Read the submission carefully and extract the following fields exactly as stated.
If a field is not explicitly stated, write "Not disclosed" — do not infer or guess.
Be concise — one value per field, no explanation.

SUBMISSION:
${submissionText}

Return ONLY valid JSON with exactly these fields, no markdown, no backticks:
{
${schemaLines}
}`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 5000,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as any).text as string
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch {
    console.warn('[eval] risk profile parse failed')
    return {}
  }
}

export async function evaluateSubmission(
  submission: { id: string; org_id: string; raw_text: string; extracted_fields?: Record<string, unknown> | null },
  orgId?: string,
) {
  const t0 = Date.now()
  const submissionText = submission.raw_text

  console.log(`[eval] submission   ${submissionText.length} chars`)
  const t_rag = Date.now()
  const { pinned, similar, riskProfileFields } = await getRelevantChunks(orgId ?? submission.org_id, submissionText)
  console.log(`[eval] rag          ${Date.now() - t_rag}ms  (${pinned.length} pinned, ${similar.length} similar)`)

  const hardStopsText = pinned.map((c: any) => `• ${c.content.slice(0, 240)}`).join('\n')
  const guidelinesText = similar.map((c: any) => `[Page ${c.page}]\n${c.content}`).join('\n\n---\n\n')
  const hardStopCheckList = pinned.map((c: any) => `- ${c.embed_text.split(':')[0].trim()}`).join('\n')

  // Fire insights + risk profile immediately — they need no check results
  const insightsPromise = runInsightsCall(submissionText)
  const riskProfilePromise = runRiskProfileCall(submissionText, riskProfileFields)

  // Stream Call 1 (checks) — fire flags as soon as decision is visible in the stream
  let flagsPromise: Promise<any> | null = null
  let partialToolInput = ''
  let flagsFired = false

  const t_call1 = Date.now()
  const stream = anthropic.messages.stream({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 6000,
    temperature: 0,
    tools: [CHECKS_TOOL],
    tool_choice: { type: 'tool', name: 'submit_evaluation' },
    messages: buildChecksMessages(submissionText, hardStopsText, guidelinesText, hardStopCheckList, pinned.length),
  } as any)

  stream.on('streamEvent', (event: any) => {
    if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
      partialToolInput += event.delta.partial_json ?? ''
      if (!flagsFired) {
        const m = partialToolInput.match(/"decision"\s*:\s*"(PROCEED|REFER|DECLINE)"/)
        if (m) {
          flagsFired = true
          console.log(`[eval] flags fired  → ${m[1]}`)
          flagsPromise = runFlagsCall(submissionText, { decision: m[1]!, guideline_checks: [] })
        }
      }
    }
  })

  const finalMsg = await stream.finalMessage()
  console.log(`[eval] call 1       ${Date.now() - t_call1}ms`)

  const usage = finalMsg.usage as any
  if (usage.cache_read_input_tokens > 0) {
    console.log(`[eval] cache HIT    ${usage.cache_read_input_tokens} tokens`)
  } else if (usage.cache_creation_input_tokens > 0) {
    console.log(`[eval] cache MISS   ${usage.cache_creation_input_tokens} tokens written`)
  }

  if (finalMsg.stop_reason === 'max_tokens') {
    throw new Error('[eval] checks call truncated — hit max_tokens')
  }

  const toolUseBlock = finalMsg.content.find((b: any) => b.type === 'tool_use')
  if (!toolUseBlock) {
    throw new Error(`[eval] checks call returned no tool_use block (stop_reason: ${finalMsg.stop_reason})`)
  }
  const checksResult = (toolUseBlock as any).input as { decision: string; guideline_checks: any[] }
  console.log(`[eval] call 1 output  ${JSON.stringify(checksResult).length} chars  (${checksResult.guideline_checks?.length ?? 0} checks)`)

  if (!flagsPromise) {
    flagsPromise = runFlagsCall(submissionText, checksResult)
  }

  // Score — server-side banded calculation
  const checks = checksResult.guideline_checks ?? []
  const failCount = checks.filter((c: any) => c.status === 'fail').length
  const reviewCount = checks.filter((c: any) => c.status === 'review').length
  const totalChecks = pinned.length
  const passCount = Math.max(0, totalChecks - failCount - reviewCount)

  // Score — server-side banded calculation, 1.0–10.0 scale with 1 decimal
  let rawScore: number
  if (failCount > 0) {
    rawScore = Math.max(0, 25 - (failCount - 1) * 8)
  } else if (reviewCount > 0) {
    const reviewRatio = reviewCount / totalChecks
    rawScore = Math.max(40, Math.min(74, Math.round(74 - reviewRatio * 34)))
  } else {
    rawScore = Math.min(100, Math.round(80 + (passCount / totalChecks) * 20))
  }
  const score = Math.round(rawScore) / 10
  console.log(`[eval] score        ${score}  (${passCount}p/${reviewCount}r/${failCount}f of ${totalChecks}) → ${checksResult.decision}`)

  // Await all parallel calls (flags already running since early in stream)
  const t_p2 = Date.now()
  const [flagsResult, insightsResult, riskProfile] = await Promise.all([
    flagsPromise,
    insightsPromise,
    riskProfilePromise,
  ])
  console.log(`[eval] parallel     ${Date.now() - t_p2}ms remaining wait`)
  console.log(`[eval] total        ${Date.now() - t0}ms`)

  return {
    decision: checksResult.decision,
    composite_score: score,
    guideline_checks: checksResult.guideline_checks,
    recommendation: flagsResult.recommendation,
    flags: flagsResult.flags,
    favorable_factors: flagsResult.favorable_factors,
    dimension_scores: flagsResult.dimension_scores,
    insights: insightsResult.insights,
    missing_info: insightsResult.missing_info,
    risk_profile: riskProfile,
  }
}

export async function extractRiskProfileFields(allChunksText: string): Promise<string[]> {
  const prompt = `You are an expert insurance underwriting system designer.

Read the following carrier underwriting guidelines and identify the key data fields
that an underwriter would need to extract from any submission to evaluate a risk.

Return ONLY a JSON array of field names — no other text, no markdown, no backticks.
Each field name must be snake_case and concise. Return 12-20 fields maximum.
Focus on the most critical underwriting variables for this specific line of business.

Examples for commercial property: ["tiv", "roof_age", "construction_class", "sprinklers", "electrical", "year_built", "losses_5yr", "vacancy", "protection_class", "named_insured", "broker", "prior_carrier"]
Examples for cyber: ["annual_revenue", "employee_count", "mfa_enabled", "edr_solution", "prior_cyber_incidents", "data_types_stored", "backup_frequency", "named_insured", "broker", "prior_carrier"]
Examples for workers comp: ["annual_payroll", "employee_count", "experience_mod_rate", "primary_operations", "prior_losses_3yr", "safety_program", "named_insured", "broker", "prior_carrier"]

GUIDELINES:
${allChunksText.slice(0, 30000)}

Return ONLY the JSON array:`

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 500,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = (response.content[0] as any).text as string
  const clean = text.replace(/```json|```/g, '').trim()

  try {
    const fields = JSON.parse(clean)
    console.log(`[guidelines] risk profile fields: ${fields.length} fields`)
    return fields
  } catch {
    console.warn('[guidelines] risk profile fields parse failed — using defaults')
    return ['named_insured', 'broker', 'tiv', 'prior_carrier', 'losses_5yr', 'location_count']
  }
}

export async function extractHardStops(allChunksText: string): Promise<Array<{
  rule_name: string
  condition: string
  section: string
}>> {
  const prompt = `Read these underwriting guidelines. Extract every HARD STOP — conditions that cause automatic DECLINE with no exceptions.

Return ONLY a JSON array, no other text:
[{
  "rule_name": "short label",
  "condition": "exactly what triggers this decline",
  "section": "section or appendix reference"
}]

Only automatic declines. Not referral triggers. Not conditional rules.

GUIDELINES:
${allChunksText}`

  const estimatedOutputTokens = Math.ceil(allChunksText.length / 20)
  const maxTokens = Math.min(8000, Math.max(4000, estimatedOutputTokens))

  const t0 = Date.now()
  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }],
  })
  console.log(`[hardstops] claude api   ${Date.now() - t0}ms`)

  if (response.stop_reason === 'max_tokens') {
    console.warn('[hardstops] truncated — retrying with 8000 tokens')

    const t1 = Date.now()
    const retryResponse = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
      max_tokens: 8000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    })
    console.log(`[hardstops] retry api    ${Date.now() - t1}ms`)

    const retryText = (retryResponse.content[0] as any).text as string
    const retryStripped = retryText.replace(/```json|```/g, '').trim()
    const retryMatch = retryStripped.match(/\[[\s\S]*\]/)

    if (!retryMatch) {
      console.warn('[hardstops] retry: no JSON array found')
      return []
    }
    try {
      const result = JSON.parse(retryMatch[0])
      console.log(`[hardstops] retry ok     ${result.length} stops`)
      return result
    } catch (e) {
      console.warn('[hardstops] retry: JSON parse failed')
      return []
    }
  }

  const text = (response.content[0] as any).text as string
  const stripped = text.replace(/```json|```/g, '').trim()
  const match = stripped.match(/\[[\s\S]*\]/)

  if (!match) {
    console.warn('[hardstops] no JSON array found in response')
    console.warn('[hardstops] raw:', stripped.slice(0, 500))
    return []
  }

  try {
    const hardStops = JSON.parse(match[0])
    console.log(`[hardstops] extracted    ${hardStops.length} stops  (total ${Date.now() - t0}ms)`)
    return hardStops
  } catch (e) {
    console.warn('[hardstops] JSON parse failed')
    return []
  }
}
