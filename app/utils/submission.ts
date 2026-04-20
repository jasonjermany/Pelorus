import type { RpField } from '~/types/submission'

export function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function rpValue(v: RpField | undefined | null): string {
  if (v == null) return ''
  return typeof v === 'object' ? (v.value ?? '') : v
}

export function rpSource(v: RpField | undefined | null): string | null {
  if (!v || typeof v !== 'object') return null
  return v.source && v.source !== 'Not disclosed' ? v.source : null
}

export function rpIsBlank(v: RpField | undefined | null): boolean {
  const val = rpValue(v)
  return !val || val === 'null' || val === 'N/A' || val === 'Not disclosed'
}

export function normalizeScore(score: number): number {
  return score > 10 ? Math.round(score) / 10 : score
}
