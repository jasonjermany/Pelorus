<template>
  <div class="h-screen flex flex-col bg-gray-50 overflow-hidden">

    <!-- Header -->
    <AppHeader variant="app">
      <div class="w-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-14">
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/app"
            class="flex items-center gap-1.5 text-[14px] text-white/70 hover:text-white transition-colors duration-150"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Dashboard
          </NuxtLink>
          <span class="text-white/30">·</span>
          <div class="flex items-center gap-1.5">
            <img src="/PelorusLogo.png" alt="Pelorus mark" class="h-14 w-auto" />
            <img src="/PelorusWordmark.png" alt="Pelorus" class="w-[9rem] h-auto" style="margin-top:5px;margin-left:-40px" />
            <span class="text-white/40 mx-1">·</span>
            <span class="text-[16px] font-semibold text-white tracking-[-0.3px]">Guidelines &amp; Settings</span>
          </div>
        </div>
      </div>
    </AppHeader>

    <!-- Main -->
    <main class="flex-1 overflow-y-auto min-h-0 mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 flex flex-col gap-5">

      <!-- Upload card (admin only) -->
      <div v-if="isAdmin" class="glass-card p-6 sm:p-7">
        <div class="flex items-start justify-between gap-6 mb-5">
          <div>
            <h2 class="text-[18px] font-semibold text-gray-900 tracking-[-0.4px] mb-1.5">Upload Guidelines</h2>
            <p class="text-[15px] text-gray-700 leading-relaxed max-w-[480px]">
              Upload your carrier's underwriting guidelines as a PDF. Hard stops and risk profile fields are automatically extracted for every evaluation.
            </p>
          </div>
          <div v-if="chunks.length" class="flex gap-5 flex-shrink-0">
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-600 mb-1">Sections</p>
              <span class="block text-[28px] font-black text-gray-900 tracking-[-1.5px] leading-none">{{ standardCount }}</span>
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-[0.12em] text-gray-600 mb-1">Hard Stops</p>
              <span class="block text-[28px] font-black text-red-600 tracking-[-1.5px] leading-none">{{ pinnedCount }}</span>
            </div>
          </div>
        </div>

        <!-- Replace warning -->
        <div v-if="chunks.length > 0" class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-[14px] text-amber-800 mb-5 flex items-center gap-2">
          <svg class="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Uploading a new file will replace all existing guidelines for this organization.
        </div>

        <!-- File input + button -->
        <div class="flex items-center gap-3">
          <div
            class="relative flex-1 border border-dashed rounded-xl bg-gray-50 hover:bg-gray-100/70 transition-all duration-150 cursor-pointer"
            :class="selectedFile ? 'border-accent-500/50' : 'border-gray-300 hover:border-gray-400'"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".pdf,.docx,.txt"
              class="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              :disabled="isUploading"
              @change="onFileSelected"
            />
            <div class="flex items-center gap-2.5 px-4 py-3 pointer-events-none">
              <svg class="w-4 h-4 flex-shrink-0" :class="selectedFile ? 'text-accent-500' : 'text-gray-600'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span class="text-[15px]" :class="selectedFile ? 'text-accent-600 font-medium' : 'text-gray-700'">
                {{ selectedFile ? selectedFile.name : 'PDF, DOCX, or TXT — click to browse' }}
              </span>
            </div>
          </div>
          <button
            class="bg-accent-500 hover:bg-accent-400 disabled:opacity-50 disabled:cursor-not-allowed text-[#050A18] font-bold text-[15px] px-5 py-3 rounded-xl transition-colors duration-150 flex-shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500/50"
            :disabled="!selectedFile || isUploading"
            @click="uploadGuidelines"
          >
            {{ isUploading ? 'Processing…' : 'Upload & Process' }}
          </button>
        </div>

        <!-- Progress -->
        <div v-if="isUploading" class="flex items-center gap-2.5 mt-4 text-[14px] text-gray-700">
          <span class="inline-block w-3.5 h-3.5 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin flex-shrink-0"/>
          Parsing document, extracting hard stops — this may take 2–3 minutes.
        </div>

        <p v-if="uploadError" class="mt-3 text-[14px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ uploadError }}</p>
        <p v-if="uploadSuccess" class="mt-3 text-[14px] text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{{ uploadSuccess }}</p>
      </div>

      <!-- Non-admin placeholder -->
      <div v-else class="glass-card p-8 text-center">
        <p class="text-[16px] font-semibold text-gray-800 mb-1">Guidelines</p>
        <p class="text-[15px] text-gray-700">Guidelines are managed by your account administrator.</p>
      </div>

      <!-- Chunks table -->
      <div v-if="chunks.length" class="glass-card overflow-hidden">
        <div class="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/[0.08] bg-navy">
          <div>
            <p class="text-[11px] font-black tracking-[0.13em] uppercase text-white">Guideline Library</p>
            <p class="text-[13px] text-gray-300 mt-0.5">
              {{ chunks.length }} total · {{ standardCount }} sections · {{ pinnedCount }} hard stops
            </p>
          </div>
          <button
            class="table-btn-navy"
            @click="loadChunks"
          >
            Refresh
          </button>
        </div>

        <p v-if="loadError" class="px-6 py-4 text-[15px] text-red-600">{{ loadError }}</p>

        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="th-cell w-16">Page</th>
                <th class="th-cell">Preview</th>
                <th class="th-cell w-28">Type</th>
                <th class="th-cell w-24">Added</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="chunk in chunks"
                :key="chunk.id"
                class="hover:bg-gray-50/80 transition-colors duration-150"
                :class="chunk.is_pinned ? 'bg-red-50/40' : ''"
              >
                <td class="td-cell font-medium text-gray-800 align-top">{{ chunk.page ?? '—' }}</td>
                <td class="td-cell align-top cursor-pointer select-none" @click="expandedId = expandedId === chunk.id ? null : chunk.id">
                  <span class="flex items-start gap-1.5">
                    <svg
                      class="mt-0.5 flex-shrink-0 text-gray-600 transition-transform duration-150"
                      :class="expandedId === chunk.id ? 'rotate-90' : ''"
                      width="10" height="10" viewBox="0 0 10 10" fill="none"
                    >
                      <path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span v-if="expandedId === chunk.id" class="text-[15px] text-gray-800 whitespace-pre-wrap leading-relaxed">{{ getCleanText(chunk.embed_text) }}</span>
                    <span v-else class="text-[15px] text-gray-800">{{ chunk.summary || getChunkPreview(chunk.embed_text) }}</span>
                  </span>
                </td>
                <td class="td-cell align-top">
                  <span
                    class="text-[12px] font-bold tracking-[0.06em] uppercase px-2.5 py-1 rounded-full whitespace-nowrap"
                    :class="chunk.is_pinned
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-gray-100 text-gray-700'"
                  >{{ chunk.is_pinned ? 'hard stop' : 'standard' }}</span>
                </td>
                <td class="td-cell text-gray-600 align-top text-[14px]">{{ formatDate(chunk.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loadError" class="glass-card py-20 flex flex-col items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <svg class="w-5 h-5 text-gray-600" viewBox="0 0 40 40" fill="none">
            <rect x="8" y="6" width="24" height="28" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <line x1="13" y1="14" x2="27" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="13" y1="20" x2="27" y2="20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="13" y1="26" x2="21" y2="26" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
        <p class="text-[16px] font-semibold text-gray-700">No guidelines uploaded yet</p>
        <p class="text-[15px] text-gray-600">Upload your carrier's underwriting guidelines PDF to get started.</p>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type AppUser = { id: string; email: string; org_id: string; role: 'admin' | 'underwriter' }

type GuidelineChunk = {
  id: string
  chunk_index: number
  page: number | null
  block_types: string[]
  is_pinned: boolean
  embed_text: string
  summary: string | null
  created_at: string
}

const { user: _sessionUser } = useUserSession()
const user = computed(() => _sessionUser.value as AppUser | undefined)
const isAdmin = computed(() => user.value?.role === 'admin')

const chunks = ref<GuidelineChunk[]>([])
const loadError = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const isUploading = ref(false)
const uploadError = ref<string | null>(null)
const uploadSuccess = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const expandedId = ref<string | null>(null)

const pinnedCount = computed(() => chunks.value.filter((c) => c.is_pinned).length)
const standardCount = computed(() => chunks.value.filter((c) => !c.is_pinned).length)

function cleanLines(t: string) {
  return t.replace(/^#+\s+/gm, '').split('\n').filter((l) => !l.includes('(cont.)') && !/^\s*={2,}\s*$/.test(l)).join('\n').trim()
}
function getCleanText(t: string) {
  return cleanLines(t)
}
function getChunkPreview(t: string) {
  let s = cleanLines(t).replace(/\s+/g, ' ').trim()
  if (s.length > 140) s = s.slice(0, 140).replace(/\s\S*$/, '') + ' …'
  return s
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function onFileSelected(e: Event) {
  const t = e.target as HTMLInputElement
  selectedFile.value = t.files?.[0] ?? null
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
    const result = await $fetch<{ chunks_stored: number; hard_stops_stored: number }>('/api/guidelines/upload', { method: 'POST', body: fd })
    uploadSuccess.value = `Done — ${result.chunks_stored} guideline sections and ${result.hard_stops_stored} hard stops extracted.`
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

<style scoped>
.glass-card {
  @apply bg-white border border-gray-200 rounded-2xl shadow-card;
}
.th-cell {
  @apply px-5 py-2.5 text-left text-[11px] font-black text-gray-800 uppercase tracking-[0.1em];
}
.td-cell {
  @apply px-5 py-3.5 text-[15px] text-gray-900;
}
.table-btn {
  @apply text-[13px] font-medium text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300 px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer;
}
.table-btn-navy {
  @apply text-[13px] font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 px-2.5 py-1.5 rounded-lg transition-all duration-150 cursor-pointer;
}
</style>
