<template>
  <div class="min-h-screen bg-surface-50">
    <header class="border-b border-primary-700/20 bg-primary-700">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <div>
          <NuxtLink to="/" class="mb-1 inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white">
            &larr; Inbox
          </NuxtLink>
          <h1 class="text-2xl font-semibold text-white">Settings</h1>
          <p class="mt-1 text-sm text-slate-200">Manage your underwriting guidelines.</p>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-6 py-8">
      <!-- Upload guidelines -->
      <section class="mb-8 rounded-xl border border-primary-700/15 bg-white p-6 shadow-sm">
        <h2 class="text-sm font-semibold text-primary-700">Upload Guidelines PDF</h2>
        <p class="mt-1 text-xs text-slate-500">
          Parsed with Reducto, embedded with Voyage AI, and stored in Supabase.
          Hard stops are automatically extracted and pinned.
        </p>

        <p v-if="chunks.length > 0" class="mt-3 text-sm text-amber-600">
          Uploading a new PDF will replace all existing guideline chunks and hard stops for this organization.
        </p>

        <div class="mt-4 flex items-center gap-3">
          <input
            ref="fileInput"
            type="file"
            accept=".pdf,.docx,.txt"
            class="text-sm text-slate-600"
            :disabled="isUploading"
            @change="onFileSelected"
          />
          <button
            class="rounded-full bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-50"
            :disabled="!selectedFile || isUploading"
            @click="uploadGuidelines"
          >
            {{ isUploading ? 'Processing...' : 'Upload & Process' }}
          </button>
        </div>

        <p v-if="uploadError" class="mt-3 text-sm text-danger-700">{{ uploadError }}</p>
        <p v-if="uploadSuccess" class="mt-3 text-sm text-success-700">{{ uploadSuccess }}</p>

        <div v-if="isUploading" class="mt-3">
          <p class="text-xs text-slate-500">Parsing with Reducto, extracting hard stops, embedding chunks... this may take a minute.</p>
        </div>
      </section>

      <!-- Guideline chunks -->
      <section>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-700">
            Guideline Chunks
            <span class="ml-2 rounded-full bg-primary-700/10 px-2 py-0.5 text-xs text-primary-700">{{ chunks.length }}</span>
          </h2>
          <button class="text-xs font-semibold text-accent-600 hover:underline" @click="loadChunks">Refresh</button>
        </div>

        <div v-if="loadError" class="py-4 text-sm text-danger-700">{{ loadError }}</div>

        <div v-else-if="!chunks.length" class="rounded-xl border border-dashed border-primary-700/20 bg-white p-8 text-center text-sm text-slate-500">
          No guidelines uploaded yet.
        </div>

        <div v-else class="space-y-2">
          <p class="text-xs text-slate-500">
            {{ chunks.length }} total chunks &middot;
            <strong class="text-slate-700">{{ standardCount }}</strong> guideline sections &middot;
            <strong class="text-danger-700">{{ pinnedCount }}</strong> hard stops
          </p>

          <div class="overflow-hidden rounded-xl border border-primary-700/15 bg-white shadow-sm">
            <table class="w-full table-fixed text-left text-sm">
              <colgroup>
                <col class="w-16">
                <col>
                <col class="w-24">
                <col class="w-28">
              </colgroup>
              <thead>
                <tr class="border-b border-primary-700/10 text-xs uppercase tracking-wide text-primary-700/70">
                  <th class="px-4 py-3 font-semibold">Page</th>
                  <th class="px-4 py-3 font-semibold">Preview</th>
                  <th class="px-4 py-3 font-semibold">Type</th>
                  <th class="px-4 py-3 font-semibold">Added</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-primary-700/10">
                <tr
                  v-for="chunk in chunks"
                  :key="chunk.id"
                  :class="chunk.is_pinned ? 'bg-danger-500/5' : ''"
                >
                  <td class="px-4 py-3 text-slate-500">{{ chunk.page ?? '—' }}</td>
                  <td
                    class="px-4 py-3 pr-6 text-xs cursor-pointer select-none"
                    :class="getChunkPreview(chunk.embed_text).length < 30 ? 'italic text-slate-400' : 'text-slate-700'"
                    @click="expandedId = expandedId === chunk.id ? null : chunk.id"
                  >
                    <span class="flex items-start gap-1.5">
                      <svg class="mt-0.5 shrink-0 text-slate-300 transition-transform" :class="expandedId === chunk.id ? 'rotate-90' : ''" width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <span v-if="expandedId === chunk.id" class="whitespace-pre-wrap">{{ getCleanText(chunk.embed_text) }}</span>
                      <span v-else>{{ getChunkPreview(chunk.embed_text) }}</span>
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
                      :class="chunk.is_pinned ? 'bg-danger-500/15 text-danger-700' : 'bg-slate-100 text-slate-600'"
                    >
                      {{ chunk.is_pinned ? 'hard stop' : 'standard' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-500">{{ formatDate(chunk.created_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type GuidelineChunk = {
  id: string
  chunk_index: number
  page: number | null
  block_types: string[]
  is_pinned: boolean
  rule_type: string
  embed_text: string
  created_at: string
}

const chunks = ref<GuidelineChunk[]>([])
const loadError = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const uploadError = ref<string | null>(null)
const uploadSuccess = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const pinnedCount = computed(() => chunks.value.filter((c) => c.is_pinned).length)
const standardCount = computed(() => chunks.value.filter((c) => !c.is_pinned).length)
const expandedId = ref<string | null>(null)

function getCleanText(embedText: string): string {
  return embedText
    .replace(/^#+\s+/gm, '')
    .split('\n')
    .filter((line) => !line.includes('(cont.)'))
    .join('\n')
    .trim()
}

function getChunkPreview(embedText: string): string {
  let text = embedText
    .replace(/^#+\s+/gm, '')
    .split('\n')
    .filter((line) => !line.includes('(cont.)'))
    .join('\n')
    .replace(/\s+/g, ' ')
    .trim()
  if (text.length > 140) text = text.slice(0, 140).replace(/\s\S*$/, '') + '…'
  return text
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

function onFileSelected(e: Event) {
  const target = e.target as HTMLInputElement
  selectedFile.value = target.files?.[0] ?? null
  uploadError.value = null
  uploadSuccess.value = null
}

async function loadChunks() {
  loadError.value = null
  try {
    const { chunks: data } = await $fetch<{ chunks: GuidelineChunk[] }>('/api/guidelines')
    chunks.value = data ?? []
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || 'Failed to load chunks'
  }
}

async function uploadGuidelines() {
  if (!selectedFile.value) return
  isUploading.value = true
  uploadError.value = null
  uploadSuccess.value = null

  try {
    const fd = new FormData()
    fd.append('file', selectedFile.value, selectedFile.value.name)

    const result = await $fetch<{ chunks_stored: number; hard_stops_stored: number }>('/api/guidelines/upload', {
      method: 'POST',
      body: fd,
    })

    uploadSuccess.value = `Done: ${result.chunks_stored} chunks stored, ${result.hard_stops_stored} hard stops extracted.`
    selectedFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    await loadChunks()
  } catch (e: any) {
    uploadError.value = e?.data?.message || e?.message || 'Upload failed'
  } finally {
    isUploading.value = false
  }
}

onMounted(loadChunks)
</script>
