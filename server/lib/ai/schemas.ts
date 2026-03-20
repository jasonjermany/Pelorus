import { z } from 'zod'

export const RuleConditionZod = z.object({
  field: z.string(),
  operator: z.enum(['<', '<=', '>', '>=', '=', 'in']),
  value: z.union([z.string(), z.number(), z.boolean()]).optional().default(''),
  values: z.array(z.string()).optional(),
})

export const RuleZod = z.object({
  id: z.string().optional(),
  sourceText: z.string().optional(),
  field: z.string(),
  operator: z.enum(['<', '<=', '>', '>=', '=', 'in']),
  value: z.union([z.string(), z.number(), z.boolean()]).optional().default(''),
  values: z.array(z.string()).optional(),
  normalizedExpression: z.string().optional(),
  conditions: z.array(RuleConditionZod).optional(),
})

export const RulesArrayZod = z.array(RuleZod)

export type RawRuleCondition = z.infer<typeof RuleConditionZod>
export type RawRule = z.infer<typeof RuleZod>
export type RawRulesArray = z.infer<typeof RulesArrayZod>

export const FactZod = z.object({
  field: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  confidence: z.number().min(0).max(1),
  sourceSnippet: z.string(),
})

export const FactExtractionZod = z.object({
  facts: z.array(FactZod),
  additionalFacts: z.array(FactZod),
})

export type RawFact = z.infer<typeof FactZod>
export type RawFactExtraction = z.infer<typeof FactExtractionZod>

// JSON Schema objects passed to Claude's output_config.
// value fields are type: 'string' because the API does not support oneOf/union types.
// Coercion from string back to number/boolean happens in normalization.ts.
// Every object node requires additionalProperties: false (API requirement).

export const RULES_JSON_SCHEMA = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    properties: {
      id: { type: 'string' },
      sourceText: { type: 'string' },
      field: { type: 'string' },
      operator: { type: 'string', enum: ['<', '<=', '>', '>=', '=', 'in'] },
      value: { type: 'string' },
      values: { type: 'array', items: { type: 'string' } },
      normalizedExpression: { type: 'string' },
      conditions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            field: { type: 'string' },
            operator: { type: 'string', enum: ['<', '<=', '>', '>=', '=', 'in'] },
            value: { type: 'string' },
            values: { type: 'array', items: { type: 'string' } },
          },
          required: ['field', 'operator'],
        },
      },
    },
    required: ['field', 'operator'],
  },
} as const

export const FACTS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    facts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          field: { type: 'string' },
          value: { type: 'string' },
          confidence: { type: 'number' },
          sourceSnippet: { type: 'string' },
        },
        required: ['field', 'value', 'confidence', 'sourceSnippet'],
      },
    },
    additionalFacts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          field: { type: 'string' },
          value: { type: 'string' },
          confidence: { type: 'number' },
          sourceSnippet: { type: 'string' },
        },
        required: ['field', 'value', 'confidence', 'sourceSnippet'],
      },
    },
  },
  required: ['facts', 'additionalFacts'],
} as const
