/**
 * Sanitizes a user-supplied field amendment value before it is saved to state.
 * Used in the editable field component's onAmend/saveEdit handler in [id].vue.
 */
export function sanitizeFieldValue(value: string, maxLength = 500): string {
  if (value == null || value === '') return ''
  let v = value
  v = v.replace(/<[^>]*>/g, '')
  v = v.replace(/[<>]/g, '')
  v = v.replace(/javascript\s*:/gi, '')
  v = v.replace(/data\s*:/gi, '')
  v = v.trim()
  return v.slice(0, maxLength)
}

/**
 * Sanitizes chat message input before it is stored in the database or sent to Claude.
 * Used in server/api/chat/message.post.ts.
 */
export function sanitizeChatInput(value: string, maxLength = 2000): string {
  if (value == null || value === '') return ''
  let v = value
  v = v.replace(/<[^>]*>/g, '')
  v = v.replace(/[<>]/g, '')
  v = v.replace(/javascript\s*:/gi, '')
  v = v.replace(/data\s*:/gi, '')
  v = v.trim()
  return v.slice(0, maxLength)
}

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+previous\s+instructions/i,
  /ignore\s+all\s+instructions/i,
  /disregard\s+your/i,
  /you\s+are\s+now/i,
  /new\s+persona/i,
  /jailbreak/i,
  /act\s+as\s+if/i,
  /pretend\s+you\s+are/i,
  /forget\s+everything/i,
  /system\s+prompt/i,
  /(.)\1{19,}/,
  /[A-Za-z0-9+/]{100,}={0,2}/,
]

/**
 * Returns true if the input contains patterns associated with prompt injection attacks.
 * Flag but do not block — set the flagged column to true in chat_messages when this returns true.
 * Used in server/api/chat/message.post.ts.
 */
export function detectInjection(value: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(value))
}
