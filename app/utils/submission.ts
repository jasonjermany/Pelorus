export function formatKey(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function normalizeScore(score: number): number {
  return score > 10 ? Math.round(score) / 10 : score
}
