import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { ProcessedSubmission } from '~/types/models'

const STORE_PATH = join(process.cwd(), 'server', 'data', 'processedSubmissions.json')

async function ensureStoreFile() {
  await mkdir(dirname(STORE_PATH), { recursive: true })
  try {
    await readFile(STORE_PATH, 'utf8')
  } catch (error) {
    console.error('Error ensuring store file in submissionStore.ts:', error)
    await writeFile(STORE_PATH, '[]', 'utf8')
  }
}

async function readAll(): Promise<ProcessedSubmission[]> {
  await ensureStoreFile()
  const raw = await readFile(STORE_PATH, 'utf8')
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ProcessedSubmission[]) : []
  } catch (error) {
    console.error('Error parsing JSON in submissionStore.ts readAll:', error)
    return []
  }
}

async function writeAll(items: ProcessedSubmission[]) {
  await ensureStoreFile()
  await writeFile(STORE_PATH, JSON.stringify(items, null, 2), 'utf8')
}

export async function listProcessedSubmissions(): Promise<ProcessedSubmission[]> {
  const all = await readAll()
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getProcessedSubmissionById(id: string): Promise<ProcessedSubmission | null> {
  const all = await readAll()
  return all.find((item) => item.id === id) || null
}

export async function saveProcessedSubmission(input: Omit<ProcessedSubmission, 'id' | 'createdAt'>): Promise<ProcessedSubmission> {
  const all = await readAll()
  const createdAt = new Date().toISOString()
  const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const item: ProcessedSubmission = {
    ...input,
    id,
    createdAt,
  }
  all.push(item)
  await writeAll(all)
  return item
}
