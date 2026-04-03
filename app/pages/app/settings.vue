<template>
  <div class="h-screen flex flex-col bg-surface-50 font-sans overflow-hidden">
    <!-- Header -->
    <AppHeader variant="app">
      <div class="mx-auto max-w-5xl px-8 py-3.5 flex items-center gap-4">
        <div class="flex flex-col gap-1.5">
          <NuxtLink
            to="/app"
            class="text-[13px] text-white/70 hover:text-white transition-colors tracking-[0.02em]"
            >← Inbox</NuxtLink
          >
          <div class="flex items-center gap-2">
            <img src="/PelorusLogo.png" width="30" height="30" alt="Pelorus" />
            <span class="font-sans text-[17px] text-white tracking-[-0.3px]">Guidelines &amp; Settings</span>
          </div>
        </div>
      </div>
    </AppHeader>

    <main class="flex-1 overflow-y-auto min-h-0 mx-auto w-full max-w-5xl px-8 py-8 flex flex-col gap-4">
      <!-- Upload Card (admin only) -->
      <div v-if="isAdmin" class="bg-white rounded-2xl border border-black/[0.07] shadow-card p-7">
        <div class="flex items-start justify-between gap-6 mb-5">
          <div>
            <h2 class="font-sans text-[21px] text-primary-800 tracking-[-0.5px] mb-1.5">Upload Guidelines</h2>
            <p class="text-[13px] text-black/65 leading-relaxed font-light max-w-[480px]">
              Upload your carrier's underwriting guidelines as a PDF. Hard stops
              and risk profile fields are automatically extracted and stored for
              every evaluation.
            </p>
          </div>
          <div v-if="chunks.length" class="flex gap-6 flex-shrink-0">
            <div class="text-right">
              <span class="block font-sans text-[26px] text-primary-800 tracking-[-1px] leading-none">{{ standardCount }}</span>
              <span class="block text-[11px] text-black/55 mt-1">Guideline sections</span>
            </div>
            <div class="text-right">
              <span class="block font-sans text-[26px] text-danger-700 tracking-[-1px] leading-none">{{ pinnedCount }}</span>
              <span class="block text-[11px] text-black/55 mt-1">Hard stops</span>
            </div>
          </div>
        </div>

        <div
          v-if="chunks.length > 0"
          class="bg-accent-500/[0.07] border border-accent-500/20 rounded-lg px-4 py-2.5 text-[12px] text-accent-600 mb-5"
        >
          ⚠ Uploading a new PDF will replace all existing guidelines for this organization.
        </div>

        <div class="flex items-center gap-3">
          <div
            class="relative flex-1 border-[1.5px] border-dashed rounded-lg bg-surface-50 hover:border-primary-800 transition-colors cursor-pointer"
            :class="selectedFile ? 'border-primary-800' : 'border-black/15'"
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" :class="selectedFile ? 'text-primary-800' : 'text-black/50'">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="text-[13px]" :class="selectedFile ? 'text-primary-800 font-medium' : 'text-black/55'">
                {{ selectedFile ? selectedFile.name : "PDF, DOCX, or TXT — click to browse" }}
              </span>
            </div>
          </div>
          <button
            class="bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-primary-800 font-semibold text-[13px] px-5 py-3 rounded-lg transition-colors flex-shrink-0"
            :disabled="!selectedFile || isUploading"
            @click="uploadGuidelines"
          >
            {{ isUploading ? "Processing..." : "Upload & Process" }}
          </button>
        </div>

        <div v-if="isUploading" class="flex items-center gap-2.5 mt-4 text-[12px] text-black/60">
          <span class="inline-block w-3.5 h-3.5 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin flex-shrink-0"/>
          Parsing document, extracting hard stops, generating embeddings — this may take 2–3 minutes.
        </div>

        <p v-if="uploadError" class="mt-3 text-[13px] text-danger-700">{{ uploadError }}</p>
        <p v-if="uploadSuccess" class="mt-3 text-[13px] text-success-700">{{ uploadSuccess }}</p>
      </div>

      <!-- Non-admin placeholder -->
      <div v-else class="bg-white rounded-2xl border border-black/[0.07] shadow-card p-8 text-center">
        <p class="text-[14px] font-semibold text-primary-800 mb-1">Guidelines</p>
        <p class="text-[13px] text-black/60 font-light">Guidelines are managed by your account administrator.</p>
      </div>

      <!-- Chunks Table -->
      <div v-if="chunks.length" class="bg-white rounded-2xl border border-black/[0.07] shadow-card overflow-y-auto">
        <div class="flex items-center justify-between px-6 py-4 border-b border-black/[0.05]">
          <div>
            <h2 class="text-[14px] font-semibold text-primary-800">Guideline Library</h2>
            <p class="text-[12px] text-black/55 mt-0.5">
              {{ chunks.length }} total · {{ standardCount }} sections · {{ pinnedCount }} hard stops
            </p>
          </div>
          <button
            class="border border-black/20 hover:border-primary-800 text-[12px] font-medium text-black/65 hover:text-primary-800 px-3 py-1.5 rounded-md transition-all"
            @click="loadChunks"
          >
            Refresh
          </button>
        </div>

        <div v-if="loadError" class="px-6 py-4 text-[13px] text-danger-700">{{ loadError }}</div>

        <table class="w-full text-left text-[13px]">
          <thead>
            <tr class="border-b border-black/[0.05]">
              <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/50 w-16">Page</th>
              <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/50">Preview</th>
              <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/50 w-28">Type</th>
              <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/50 w-24">Added</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black/[0.04]">
            <tr
              v-for="chunk in chunks"
              :key="chunk.id"
              class="hover:bg-surface-50 transition-colors"
              :class="chunk.is_pinned ? 'bg-danger-500/[0.015]' : ''"
            >
              <td class="px-5 py-3 text-[13px] font-medium text-primary-800 align-top">{{ chunk.page ?? "—" }}</td>
              <td class="px-5 py-3 align-top cursor-pointer select-none" @click="expandedId = expandedId === chunk.id ? null : chunk.id">
                <span class="flex items-start gap-1.5">
                  <svg class="mt-0.5 flex-shrink-0 text-black/65 transition-transform" :class="expandedId === chunk.id ? 'rotate-90' : ''" width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M3 2l4 3-4 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span v-if="expandedId === chunk.id" class="text-[14px] text-black/80 whitespace-pre-wrap leading-relaxed">{{ getCleanText(chunk.embed_text) }}</span>
                  <span v-else class="text-[14px] text-black/75">{{ getChunkPreview(chunk.embed_text) }}</span>
                </span>
              </td>
              <td class="px-5 py-3 align-top">
                <span
                  class="text-[10px] font-bold tracking-[0.06em] px-2.5 py-1 rounded-full whitespace-nowrap"
                  :class="chunk.is_pinned ? 'bg-danger-500/10 text-danger-700' : 'bg-black/[0.07] text-black/65'"
                  >{{ chunk.is_pinned ? "hard stop" : "standard" }}</span
                >
              </td>
              <td class="px-5 py-3 text-[12px] text-black/65 align-top">{{ formatDate(chunk.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loadError" class="bg-white rounded-2xl border border-black/[0.07] shadow-card py-20 flex flex-col items-center gap-3">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" class="text-black/15">
          <rect x="8" y="6" width="24" height="28" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <line x1="13" y1="14" x2="27" y2="14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="13" y1="20" x2="27" y2="20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="13" y1="26" x2="21" y2="26" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p class="text-[14px] font-semibold text-black/60">No guidelines uploaded yet</p>
        <p class="text-[13px] text-black/50 font-light">Upload your carrier's underwriting guidelines PDF to get started.</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

type GuidelineChunk = {
  id: string;
  chunk_index: number;
  page: number | null;
  block_types: string[];
  is_pinned: boolean;
  rule_type: string;
  embed_text: string;
  created_at: string;
};

const { user } = useUserSession()
const isAdmin = computed(() => user.value?.role === 'admin')

const chunks = ref<GuidelineChunk[]>([]);
const loadError = ref<string | null>(null);
const selectedFile = ref<File | null>(null);
const isUploading = ref(false);
const uploadError = ref<string | null>(null);
const uploadSuccess = ref<string | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const expandedId = ref<string | null>(null);

const pinnedCount = computed(() => chunks.value.filter((c) => c.is_pinned).length);
const standardCount = computed(() => chunks.value.filter((c) => !c.is_pinned).length);

function getCleanText(t: string) {
  return t.replace(/^#+\s+/gm, "").split("\n").filter((l) => !l.includes("(cont.)")).join("\n").trim();
}
function getChunkPreview(t: string) {
  let s = t.replace(/^#+\s+/gm, "").split("\n").filter((l) => !l.includes("(cont.)")).join("\n").replace(/\s+/g, " ").trim();
  if (s.length > 140) s = s.slice(0, 140).replace(/\s\S*$/, "") + " …";
  return s;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}
function onFileSelected(e: Event) {
  const t = e.target as HTMLInputElement;
  selectedFile.value = t.files?.[0] ?? null;
  uploadError.value = null;
  uploadSuccess.value = null;
}
async function loadChunks() {
  loadError.value = null;
  try {
    const { chunks: data } = await $fetch<{ chunks: GuidelineChunk[] }>("/api/guidelines");
    chunks.value = data ?? [];
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || "Failed to load chunks";
  }
}
async function uploadGuidelines() {
  if (!selectedFile.value) return;
  isUploading.value = true;
  uploadError.value = null;
  uploadSuccess.value = null;
  try {
    const fd = new FormData();
    fd.append("file", selectedFile.value, selectedFile.value.name);
    const result = await $fetch<{ chunks_stored: number; hard_stops_stored: number }>("/api/guidelines/upload", { method: "POST", body: fd });
    uploadSuccess.value = `Done — ${result.chunks_stored} guideline sections and ${result.hard_stops_stored} hard stops extracted.`;
    selectedFile.value = null;
    if (fileInput.value) fileInput.value.value = "";
    await loadChunks();
  } catch (e: any) {
    uploadError.value = e?.data?.message || e?.message || "Upload failed";
  } finally {
    isUploading.value = false;
  }
}
onMounted(loadChunks);
</script>
