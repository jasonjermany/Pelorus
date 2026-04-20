const INJECTION_PATTERNS: Array<[RegExp, string]> = [
  [/ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?|context)/gi, '[CONTENT REDACTED]'],
  [/disregard\s+(all\s+)?(previous|prior|above|earlier|your)\s+(instructions?|rules?|prompts?)/gi, '[CONTENT REDACTED]'],
  [/forget\s+(all\s+)?(previous|prior|your)\s+(instructions?|rules?|context|persona)/gi, '[CONTENT REDACTED]'],
  [/you\s+are\s+now\s+(a|an|the)\s+/gi, '[CONTENT REDACTED] '],
  [/act\s+as\s+(if\s+you\s+(are|were)\s+)?(a|an)\s+/gi, '[CONTENT REDACTED] '],
  [/pretend\s+(you\s+are|to\s+be)\s+/gi, '[CONTENT REDACTED] '],
  [/new\s+persona\s*:/gi, '[CONTENT REDACTED]:'],
  [/jailbreak/gi, '[CONTENT REDACTED]'],
  [/system\s*prompt/gi, '[CONTENT REDACTED]'],
  [/do\s+not\s+follow\s+(the\s+)?(instructions?|rules?|guidelines?)/gi, '[CONTENT REDACTED]'],
  [/override\s+(your\s+)?(instructions?|rules?|guidelines?|persona)/gi, '[CONTENT REDACTED]'],
]

/**
 * Strips prompt injection patterns from document text before it is stored as raw_text
 * or passed to Claude as submission context. Does not truncate — preserves full content.
 */
export function scrubDocumentText(text: string): string {
  let out = text
  for (const [pattern, replacement] of INJECTION_PATTERNS) {
    out = out.replace(pattern, replacement)
  }
  return out
}
