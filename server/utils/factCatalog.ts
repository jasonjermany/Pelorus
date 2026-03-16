import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export type FactCatalogItem = {
  factKey: string
  displayName: string
  dataType: 'number' | 'boolean' | 'string'
  category: string
}

function parseDataType(value: unknown): FactCatalogItem['dataType'] {
  if (value === 'number' || value === 'boolean' || value === 'string') return value
  return 'string'
}

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function toSnakeCase(value: string): string {
  return normalizeToken(value).replace(/\s+/g, '_')
}

export async function loadFactCatalog(): Promise<FactCatalogItem[]> {
  try {
    const filePath = join(process.cwd(), 'server', 'data', 'factCatalog.json')
    const raw = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const candidate = item as Record<string, unknown>
        return {
          factKey: typeof candidate.factKey === 'string' ? toSnakeCase(candidate.factKey) : '',
          displayName: typeof candidate.displayName === 'string' ? candidate.displayName : '',
          dataType: parseDataType(candidate.dataType),
          category: typeof candidate.category === 'string' ? candidate.category : 'general',
        }
      })
      .filter((item) => item.factKey.length > 0)
  } catch {
    // Backward compatibility: if catalog is missing/invalid, continue with dynamic behavior.
    return []
  }
}

export function getFactKeys(catalog: FactCatalogItem[]): string[] {
  return Array.from(new Set(catalog.map((item) => item.factKey))).filter(Boolean)
}
