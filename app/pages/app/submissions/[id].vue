<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">

    <!-- ── Header ──────────────────────────────────────────────── -->
    <AppHeader variant="app">
      <div class="w-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 h-14">
        <div class="flex items-center gap-4 min-w-0">
          <NuxtLink
            to="/app"
            class="flex items-center gap-1.5 text-[14px] text-gray-600 hover:text-gray-800 transition-colors duration-150 flex-shrink-0"
          >
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Dashboard
          </NuxtLink>
          <span class="text-gray-500 flex-shrink-0">·</span>
          <div class="flex items-center gap-2 min-w-0">
            <img src="/PelorusLogo.png" width="22" height="22" alt="Pelorus" class="flex-shrink-0" />
            <span class="text-[16px] font-semibold text-gray-900 tracking-[-0.3px] truncate">
              {{ namedInsured || 'Submission Review' }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            v-if="verdict"
            class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200/70 hover:border-gray-300 text-gray-800 hover:text-gray-900 text-[14px] font-medium transition-all duration-150 disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-500/50"
            :disabled="isDownloading"
            @click="downloadPdf"
          >
            <svg v-if="!isDownloading" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <svg v-else class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            {{ isDownloading ? 'Generating…' : 'Download PDF' }}
          </button>
        </div>
      </div>
    </AppHeader>

    <!-- ── Main ────────────────────────────────────────────────── -->
    <main
      class="mx-auto px-4 sm:px-6 py-7 flex flex-col gap-5 transition-all duration-200"
      :class="activeTab === 'Risk Profile' && verdict ? 'max-w-[1400px]' : 'max-w-4xl'"
    >
      <div v-if="isLoading" class="py-20 text-center text-[15px] text-gray-600">Loading…</div>
      <div v-else-if="loadError" class="py-20 text-center text-[15px] text-red-600">{{ loadError }}</div>

      <template v-else>

        <!-- Decision Card -->
        <SubmissionDecisionCard v-if="verdict" :verdict="verdict" />

        <!-- Dimension Scores -->
        <div v-if="dimGroups.length" class="glass-card p-5 sm:p-6">
          <p class="text-[11px] font-black tracking-[0.13em] uppercase text-gray-900 mb-5">Dimension Scores</p>
          <div v-for="(group, gi) in dimGroups" :key="group.locationId || gi">
            <div
              v-if="dimGroups.length > 1"
              class="flex items-center gap-2 mb-3"
              :class="gi > 0 ? 'mt-5 pt-5 border-t border-gray-100' : ''"
            >
              <span class="text-[12px] font-bold text-gray-800 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded tracking-[0.04em]">{{ group.locationId }}</span>
              <span v-if="group.address" class="text-[13px] text-gray-600 truncate">{{ group.address }}</span>
            </div>
            <div class="flex flex-col divide-y divide-gray-100">
              <div v-for="f in group.numericFields" :key="f.label" class="flex items-center gap-4 py-2.5">
                <span class="text-[10px] font-black uppercase tracking-[0.13em] text-gray-700 w-36 flex-shrink-0">{{ f.label }}</span>
                <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-1.5 rounded-full transition-all duration-700"
                    :class="f.score >= 7.5 ? 'bg-green-500' : f.score >= 5.0 ? 'bg-accent-500' : 'bg-red-500'"
                    :style="{ width: `${f.score * 10}%` }"
                  />
                </div>
                <span class="text-[15px] font-semibold text-gray-800 w-8 text-right flex-shrink-0">{{ f.score.toFixed(1) }}</span>
              </div>
              <div v-for="f in group.textFields" :key="f.label" class="py-2 border-b border-gray-100 last:border-0">
                <p class="text-[10px] font-black uppercase tracking-[0.13em] text-gray-600 mb-0.5">{{ f.label }}</p>
                <span class="text-[15px] text-gray-900">{{ f.value }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div v-if="verdict">
          <div class="bg-gray-100 border border-gray-200 rounded-xl p-1 mb-5 flex gap-0.5">
            <button
              v-for="tab in tabs"
              :key="tab"
              class="flex-1 py-2 rounded-lg text-[14px] font-medium transition-all duration-150 cursor-pointer"
              :class="activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-700 hover:text-gray-800'"
              @click="activeTab = tab"
            >{{ tab }}</button>
          </div>

          <!-- Summary -->
          <div v-if="activeTab === 'Summary'" class="flex flex-col gap-4">
            <div class="glass-card p-5 sm:p-6">
              <p class="text-[11px] font-black tracking-[0.13em] uppercase text-gray-900 mb-3">Recommended Next Action</p>
              <ol class="flex flex-col gap-2.5 list-none">
                <li v-for="(item, i) in verdict.recommendation?.action_items" :key="i" class="flex gap-3 text-[15px] text-gray-800 leading-relaxed">
                  <span class="text-[#92700A] font-bold flex-shrink-0 w-4">{{ i + 1 }}.</span>{{ item }}
                </li>
              </ol>
            </div>
            <div v-if="sortedFlags.length" class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 flex items-center justify-between border-b border-gray-100">
                <p class="text-[11px] font-black tracking-[0.13em] uppercase text-gray-900">Concerns &amp; Flags</p>
                <span class="text-[14px] text-gray-600">{{ sortedFlags.length }} item{{ sortedFlags.length !== 1 ? 's' : '' }}</span>
              </div>
              <div class="flex flex-col divide-y divide-gray-100 overflow-y-auto" style="max-height:min(50vh,480px)">
                <div
                  v-for="(flag, i) in sortedFlags"
                  :key="i"
                  class="px-5 sm:px-6 py-5 flex gap-4"
                  :class="flag.type === 'CONDITION' ? 'bg-red-50/40' : 'bg-amber-50/30'"
                >
                  <div class="w-[3px] rounded-full flex-shrink-0 mt-0.5" :class="flag.type === 'CONDITION' ? 'bg-red-500' : 'bg-amber-500'" />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-start gap-2 mb-1.5">
                      <p class="text-[15px] font-semibold text-gray-900 flex-1 min-w-0">{{ flag.title }}</p>
                      <span
                        class="text-[11px] font-bold tracking-[0.06em] uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                        :class="flag.type === 'CONDITION' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'"
                      >{{ flag.type }}</span>
                    </div>
                    <p class="text-[15px] text-gray-800 leading-relaxed mb-2.5">{{ flag.explanation }}</p>
                    <p class="text-[14px] text-gray-700 mb-1.5"><span class="font-semibold text-gray-800">Action:</span> {{ flag.action_required }}</p>
                    <p class="text-[13px] text-gray-600"><span class="font-semibold text-gray-700">Ref:</span> {{ flag.cited_section }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="verdict.favorable_factors?.length" class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 border-b border-gray-100">
                <p class="text-[11px] font-black tracking-[0.13em] uppercase text-gray-900">Favorable Factors</p>
              </div>
              <ul class="flex flex-col divide-y divide-gray-100 list-none">
                <li v-for="(f, i) in verdict.favorable_factors" :key="i" class="flex items-start gap-3 px-5 sm:px-6 py-4 text-[15px] text-gray-800 leading-relaxed">
                  <svg class="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ f }}
                </li>
              </ul>
            </div>
          </div>

          <!-- Guidelines -->
          <SubmissionGuidelinesTab
            v-else-if="activeTab === 'Guidelines'"
            :checks="verdict.guideline_checks ?? []"
          />

          <!-- Insights -->
          <div v-else-if="activeTab === 'Insights'" class="flex flex-col gap-4">
            <div v-if="verdict.insights" class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 border-b border-gray-100">
                <p class="text-[11px] font-black tracking-[0.13em] uppercase text-gray-900">Underwriting Insights</p>
              </div>
              <div class="divide-y divide-gray-100 overflow-y-auto" style="max-height:min(55vh,520px)">
                <div v-for="(value, key) in verdict.insights" :key="key" class="px-5 sm:px-6 py-5">
                  <p class="text-[11px] font-black uppercase tracking-[0.13em] text-gray-900 mb-2">{{ formatKey(key) }}</p>
                  <p class="text-[15px] text-gray-800 leading-relaxed">{{ value }}</p>
                </div>
              </div>
            </div>
            <div v-if="verdict.missing_info?.length" class="glass-card overflow-hidden">
              <div class="px-5 sm:px-6 py-4 border-b border-gray-100">
                <p class="text-[11px] font-black tracking-[0.13em] uppercase text-gray-900">Missing Information</p>
              </div>
              <div class="flex flex-col divide-y divide-gray-100">
                <div v-for="(item, i) in verdict.missing_info" :key="i" class="px-5 sm:px-6 py-4">
                  <div class="flex items-center gap-2 mb-1.5">
                    <p class="text-[15px] font-semibold text-gray-900">{{ item.label }}</p>
                    <span
                      v-if="item.priority"
                      class="text-[11px] font-bold tracking-[0.08em] uppercase px-2 py-0.5 rounded-full"
                      :class="item.priority === 'BINDING' ? 'bg-red-50 text-red-700 border border-red-200' : item.priority === 'PRE_BIND' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-gray-100 text-gray-800'"
                    >{{ item.priority }}</span>
                  </div>
                  <p class="text-[15px] text-gray-800 leading-relaxed">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Risk Profile -->
          <SubmissionRiskProfileTab
            v-else-if="activeTab === 'Risk Profile'"
            :risk-profile="verdict.risk_profile ?? {}"
          />
        </div>

        <!-- No verdict -->
        <div v-else class="glass-card p-12 sm:p-16 text-center">
          <template v-if="submission?.status === 'error'">
            <div class="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
              <svg class="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-[16px] font-medium text-red-600 mb-4">Evaluation failed</p>
            <button
              class="bg-accent-500 hover:bg-accent-400 text-[#050A18] px-5 py-2.5 rounded-xl text-[15px] font-bold transition-colors duration-150 disabled:opacity-50 cursor-pointer"
              :disabled="isEvaluating"
              @click="runEvaluation"
            >{{ isEvaluating ? 'Evaluating…' : 'Retry Evaluation' }}</button>
          </template>
          <template v-else>
            <div class="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto mb-4">
              <svg class="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <p class="text-[16px] text-gray-700 mb-4">
              {{ submission?.status === 'processing' ? 'Analysis in progress…' : 'Not yet evaluated' }}
            </p>
            <button
              class="bg-accent-500 hover:bg-accent-400 text-[#050A18] px-5 py-2.5 rounded-xl text-[15px] font-bold transition-colors duration-150 disabled:opacity-50 cursor-pointer"
              :disabled="isEvaluating"
              @click="runEvaluation"
            >{{ isEvaluating ? 'Evaluating…' : 'Run Evaluation' }}</button>
          </template>
          <p v-if="evalError" class="mt-3 text-[14px] text-red-600">{{ evalError }}</p>
        </div>

      </template>
    </main>

    <!-- ── Chat Panel ─────────────────────────────────────────── -->
    <SubmissionChatPanel :submission-id="id" :named-insured="namedInsured" />

    <!-- ── Source Modal ───────────────────────────────────────── -->
    <SubmissionSourceModal
      v-if="sourceModal"
      :field-key="sourceModal.key"
      :source-doc="sourceModalDoc"
      :source-location="sourceModalLocation"
      :raw-text="sourceModalRawText"
      :context="sourceModalContext"
      @close="closeSourceModal"
      @amend="amendFromModal"
    />

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue'
import { AMENDMENTS_KEY } from '~/composables/useAmendments'
import type { SubmissionResponse } from '~/types/submission'

const route = useRoute()
const id = route.params.id as string

// ── Amendment state (shared with tab components via provide) ──
const amendmentsApi = useAmendments(id)
provide(AMENDMENTS_KEY, amendmentsApi)
const {
  amendments,
  sourceModal,
  sourceModalDoc,
  sourceModalLocation,
  sourceModalRawText,
  sourceModalContext,
  closeSourceModal,
  amendFromModal,
} = amendmentsApi

// ── Submission state ───────────────────────────────────────────
const submission = ref<SubmissionResponse | null>(null)
const verdict = computed(() => submission.value?.verdict ?? null)

const namedInsured = computed(() => {
  const raw = verdict.value?.risk_profile?.named_insured
  if (raw === undefined) return null
  return rpValue(raw) || null
})

const isLoading = ref(false)
const loadError = ref<string | null>(null)
const isEvaluating = ref(false)
const evalError = ref<string | null>(null)
const isDownloading = ref(false)

const tabs = ['Summary', 'Guidelines', 'Insights', 'Risk Profile'] as const
const activeTab = ref<(typeof tabs)[number]>('Summary')

const sortedFlags = computed(() => {
  if (!verdict.value?.flags) return []
  return [...verdict.value.flags].sort((a, b) => {
    if (a.type === 'CONDITION' && b.type !== 'CONDITION') return -1
    if (a.type !== 'CONDITION' && b.type === 'CONDITION') return 1
    return 0
  })
})

// ── Dimension score groups ─────────────────────────────────────
type DimGroup = {
  locationId: string
  address?: string
  numericFields: Array<{ label: string; score: number }>
  textFields: Array<{ label: string; value: string }>
}

const dimGroups = computed<DimGroup[]>(() => {
  if (verdict.value?.dimension_scores) {
    return [{
      locationId: '',
      address: undefined,
      numericFields: Object.entries(verdict.value.dimension_scores).map(([key, score]) => ({
        label: formatKey(key),
        score: normalizeScore(score as number),
      })),
      textFields: [],
    }]
  }
  return []
})

// ── Data loading ───────────────────────────────────────────────
async function load() {
  isLoading.value = true
  loadError.value = null
  try {
    submission.value = await $fetch<SubmissionResponse>(`/api/submissions/${id}`)
    const saved = submission.value?.verdict?.field_amendments
    if (saved) amendments.value = { ...saved }
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || 'Failed to load'
  } finally {
    isLoading.value = false
  }
}

async function runEvaluation() {
  isEvaluating.value = true
  evalError.value = null
  try {
    await $fetch(`/api/submissions/${id}/evaluate`, { method: 'POST' })
    await load()
  } catch (e: any) {
    evalError.value = e?.data?.message || e?.message || 'Evaluation failed'
  } finally {
    isEvaluating.value = false
  }
}

async function downloadPdf() {
  isDownloading.value = true
  try {
    const blob = await $fetch<Blob>(`/api/submissions/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'submission_review.pdf'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: any) {
    console.error('PDF download failed:', e?.message)
  } finally {
    isDownloading.value = false
  }
}

onMounted(load)
</script>
