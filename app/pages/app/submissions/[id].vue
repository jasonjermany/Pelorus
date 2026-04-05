<template>
  <div class="min-h-screen bg-surface-50 font-sans">
    <!-- Header -->
    <AppHeader variant="app">
      <div
        class="mx-auto max-w-5xl px-8 py-3.5 flex items-center justify-between gap-4"
      >
        <div class="flex flex-col gap-1.5">
          <NuxtLink
            to="/app"
            class="text-[13px] text-white/60 hover:text-white/90 transition-colors tracking-[0.02em]"
            >← Inbox</NuxtLink
          >
          <div class="flex items-center gap-2">
            <img src="/PelorusLogo.png" width="30" height="30" alt="Pelorus" />
            <div class="flex flex-col">
              <span class="font-sans text-[22px] font-semibold text-white tracking-[-0.3px] leading-tight">
                {{ namedInsured || 'Submission Review' }}
              </span>
              <span v-if="namedInsured" class="text-[14px] text-white/65 tracking-[0.01em]">Submission Review</span>
            </div>
          </div>
        </div>
        <button
          v-if="verdict"
          class="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[13px] font-medium transition-colors disabled:opacity-50"
          :disabled="isDownloading"
          @click="downloadPdf"
        >
          <svg v-if="!isDownloading" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          {{ isDownloading ? 'Generating...' : 'Download PDF' }}
        </button>
      </div>
    </AppHeader>

    <main class="mx-auto max-w-5xl px-8 py-8 flex flex-col gap-4">
      <div v-if="isLoading" class="py-16 text-center text-[13px] text-black/30">Loading...</div>
      <div v-else-if="loadError" class="py-16 text-center text-[13px] text-danger-700">{{ loadError }}</div>

      <template v-else>
        <!-- Decision Banner -->
        <div
          v-if="verdict"
          class="flex items-start justify-between gap-6 rounded-xl px-7 py-5 border"
          :class="{
            'bg-success-500/[0.04] border-success-500/20': verdict.decision === 'PROCEED',
            'bg-accent-500/[0.06] border-accent-500/20': verdict.decision === 'REFER',
            'bg-danger-500/[0.04] border-danger-500/15': verdict.decision === 'DECLINE',
          }"
        >
          <div class="flex-1 min-w-0">
            <span class="block text-[10px] font-bold tracking-[0.12em] uppercase text-black/50 mb-1">Decision</span>
            <span class="block font-sans text-[26px] tracking-[-0.5px] mb-2" :class="decisionTextClass">{{ verdict.decision }}</span>
            <p class="text-[13px] text-black/70 leading-relaxed mb-3">{{ verdict.recommendation?.summary }}</p>
            <div class="flex items-center flex-wrap gap-2.5">
              <span v-if="verdict.risk_profile?.tiv && !rpIsBlank(verdict.risk_profile.tiv)" class="text-[12px] text-black/55">TIV: {{ rpValue(verdict.risk_profile.tiv) }}</span>
              <span v-if="verdict.analyzed_in_seconds" class="bg-black/[0.06] text-[11px] text-black/60 font-medium px-2.5 py-1 rounded-full">Analyzed in {{ verdict.analyzed_in_seconds }}s</span>
            </div>
          </div>
          <div class="text-right flex-shrink-0 flex items-baseline gap-1.5">
            <span class="font-sans text-[48px] tracking-[-2px] leading-none" :class="decisionTextClass">{{ normalizeScore(verdict.composite_score).toFixed(1) }}</span>
            <span class="text-[22px] font-light" :class="decisionTextClass">/ 10</span>
          </div>
        </div>

        <!-- Dimension Scores -->
        <div v-if="verdict?.dimension_scores" class="bg-white rounded-xl border border-black/[0.07] shadow-card p-5">
          <h3 class="text-[12px] font-semibold text-primary-800 mb-4">Dimension Scores</h3>
          <div class="grid grid-cols-2 gap-x-8 gap-y-3">
            <div v-for="(score, key) in verdict.dimension_scores" :key="key">
              <div class="flex justify-between mb-1.5">
                <span class="text-[12px] font-medium text-black/65">{{ formatKey(key) }}</span>
                <span class="text-[12px] font-bold text-primary-800">{{ normalizeScore(score).toFixed(1) }}<span class="text-[10px] font-normal text-primary-800">/10</span></span>
              </div>
              <div class="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                <div
                  class="h-1.5 rounded-full transition-all duration-500"
                  :class="normalizeScore(score) >= 7.5 ? 'bg-success-500' : normalizeScore(score) >= 5.0 ? 'bg-accent-500' : 'bg-danger-500'"
                  :style="{ width: `${normalizeScore(score) * 10}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div v-if="verdict">
          <div class="flex gap-1 bg-white rounded-xl border border-black/[0.07] shadow-card p-1 mb-4">
            <button
              v-for="tab in tabs"
              :key="tab"
              class="flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all"
              :class="activeTab === tab ? 'bg-primary-800 text-white' : 'text-black/55 hover:bg-surface-50 hover:text-primary-800'"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <!-- Summary -->
          <div v-if="activeTab === 'Summary'" class="flex flex-col gap-4">

            <!-- Recommended Next Action -->
            <div class="bg-primary-800 rounded-xl p-6">
              <p class="text-[10px] font-bold tracking-[0.12em] uppercase text-white/50 mb-1.5">Recommended Next Action</p>
              <p class="text-[14px] text-white/90 leading-relaxed mb-4">{{ verdict.recommendation?.summary }}</p>
              <ol class="flex flex-col gap-2 list-none">
                <li v-for="(item, i) in verdict.recommendation?.action_items" :key="i" class="flex gap-2.5 text-[13px] text-white/75 leading-relaxed">
                  <span class="text-accent-500 font-bold flex-shrink-0">{{ i + 1 }}.</span>{{ item }}
                </li>
              </ol>
            </div>

            <!-- Concerns & Flags -->
            <div v-if="sortedFlags.length" class="bg-white rounded-xl border border-black/[0.07] shadow-card overflow-hidden">
              <div class="px-5 py-3.5 border-b border-black/[0.05] flex items-center justify-between">
                <h3 class="text-[13px] font-semibold text-primary-800">Concerns &amp; Flags</h3>
                <span class="text-[11px] text-black/55">{{ sortedFlags.length }} item{{ sortedFlags.length !== 1 ? 's' : '' }}</span>
              </div>
              <div class="flex flex-col divide-y divide-black/[0.04]">
                <div
                  v-for="(flag, i) in sortedFlags"
                  :key="i"
                  class="p-5"
                  :class="flag.type === 'CONDITION' ? 'bg-danger-500/[0.02]' : 'bg-accent-500/[0.02]'"
                >
                  <div class="flex items-start justify-between gap-3 mb-2">
                    <p class="text-[14px] font-semibold text-primary-800">{{ flag.title }}</p>
                    <span
                      class="flex-shrink-0 text-[10px] font-bold tracking-[0.06em] px-2.5 py-1 rounded-full"
                      :class="flag.type === 'CONDITION' ? 'bg-danger-500/10 text-danger-700' : 'bg-accent-500/15 text-accent-600'"
                      >{{ flag.type }}</span
                    >
                  </div>
                  <p class="text-[13px] text-black/70 leading-relaxed mb-2">{{ flag.explanation }}</p>
                  <p class="text-[12px] text-black/65 font-medium mb-1.5"><strong class="text-primary-800">Action:</strong> {{ flag.action_required }}</p>
                  <p class="text-[11px] text-black/55">Ref: {{ flag.cited_section }}</p>
                </div>
              </div>
            </div>

            <!-- Favorable Factors -->
            <div v-if="verdict.favorable_factors?.length" class="bg-white rounded-xl border border-black/[0.07] shadow-card overflow-hidden">
              <div class="px-5 py-3.5 border-b border-black/[0.05]">
                <h3 class="text-[13px] font-semibold text-success-700">Favorable Factors</h3>
              </div>
              <ul class="flex flex-col divide-y divide-black/[0.04] list-none">
                <li v-for="(f, i) in verdict.favorable_factors" :key="i" class="flex items-start gap-3 px-5 py-3 text-[13px] text-black/70 leading-relaxed">
                  <span class="text-success-500 font-bold flex-shrink-0 mt-0.5">✓</span>{{ f }}
                </li>
              </ul>
            </div>

            <!-- Risk Summary for Quoting -->
            <div v-if="verdict.risk_profile" class="bg-white rounded-xl border border-black/[0.07] shadow-card overflow-hidden">
              <div class="px-5 py-3.5 border-b border-black/[0.05]">
                <h3 class="text-[13px] font-semibold text-primary-800">Risk Summary for Quoting</h3>
              </div>
              <table class="w-full text-left text-[13px]">
                <tbody class="divide-y divide-black/[0.04]">
                  <tr v-for="(raw, key) in verdict.risk_profile" :key="key" class="hover:bg-surface-50 transition-colors">
                    <td class="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-black/50 w-44 align-top">{{ formatKey(key) }}</td>
                    <td class="px-5 py-3 align-top">
                      <span v-if="!rpIsBlank(raw)" class="text-[13px] text-black/75 leading-relaxed">{{ rpValue(raw) }}</span>
                      <span v-else class="text-black/25">—</span>
                      <p v-if="rpSource(raw)" class="text-[11px] text-black/35 mt-0.5">{{ rpSource(raw) }}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Guidelines -->
          <div v-else-if="activeTab === 'Guidelines'">
            <div class="bg-white rounded-xl border border-black/[0.07] shadow-card overflow-hidden">
              <div class="px-5 py-3.5 border-b border-black/[0.05] flex items-center justify-between">
                <h3 class="text-[13px] font-semibold text-primary-800">Guideline Checks</h3>
                <span class="text-[12px] text-black/50">
                  <span v-if="verdict.guideline_checks?.length">{{ verdict.guideline_checks.length }} check{{ verdict.guideline_checks.length !== 1 ? "s" : "" }} require attention</span>
                  <span v-else class="text-success-700 font-medium">All checks passed</span>
                </span>
              </div>
              <table class="w-full text-left text-[13px]">
                <thead>
                  <tr class="border-b border-black/[0.05] bg-surface-50">
                    <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/60">Rule</th>
                    <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/60">Required</th>
                    <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/60">Submitted</th>
                    <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/60 w-24">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-black/[0.04]">
                  <tr
                    v-for="(check, i) in verdict.guideline_checks"
                    :key="i"
                    class="hover:bg-surface-50 transition-colors"
                    :class="{ 'bg-danger-500/[0.02]': check.status === 'fail', 'bg-accent-500/[0.02]': check.status === 'review' }"
                  >
                    <td class="px-5 py-3 align-top">
                      <p class="font-semibold text-primary-800 text-[13px]">{{ check.rule }}</p>
                      <p class="text-[11px] text-black/55 mt-0.5">{{ check.cited_section }}</p>
                    </td>
                    <td class="px-5 py-3 text-[13px] text-black/65 leading-relaxed align-top">{{ check.required }}</td>
                    <td class="px-5 py-3 text-[13px] text-black/65 leading-relaxed align-top">{{ check.submitted }}</td>
                    <td class="px-5 py-3 align-top">
                      <span
                        class="text-[10px] font-bold tracking-[0.06em] px-2.5 py-1 rounded-full whitespace-nowrap"
                        :class="{
                          'bg-success-500/10 text-success-700': check.status === 'pass',
                          'bg-accent-500/15 text-accent-600': check.status === 'review',
                          'bg-danger-500/10 text-danger-700': check.status === 'fail',
                        }"
                        >{{ check.status }}</span
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Insights -->
          <div v-else-if="activeTab === 'Insights'" class="flex flex-col gap-4">
            <div v-if="verdict.insights" class="bg-white rounded-xl border border-black/[0.07] shadow-card overflow-hidden">
              <div class="px-5 py-3.5 border-b border-black/[0.05]">
                <h3 class="text-[13px] font-semibold text-primary-800">Underwriting Insights</h3>
              </div>
              <div class="grid grid-cols-2 gap-0 divide-x divide-y divide-black/[0.05]">
                <div v-for="(value, key) in verdict.insights" :key="key" class="p-5">
                  <p class="text-[10px] font-bold uppercase tracking-[0.1em] text-black/60 mb-2">{{ formatKey(key) }}</p>
                  <p class="text-[13px] text-black/70 leading-relaxed">{{ value }}</p>
                </div>
              </div>
            </div>
            <div v-if="verdict.missing_info?.length" class="bg-white rounded-xl border border-black/[0.07] shadow-card overflow-hidden">
              <div class="px-5 py-3.5 border-b border-black/[0.05]">
                <h3 class="text-[13px] font-semibold text-accent-600">Missing Information</h3>
              </div>
              <div class="flex flex-col divide-y divide-black/[0.04]">
                <div v-for="(item, i) in verdict.missing_info" :key="i" class="px-5 py-4">
                  <p class="text-[13px] font-semibold text-primary-800 mb-1">{{ item.label }}</p>
                  <p class="text-[13px] text-black/65 leading-relaxed">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Risk Profile -->
          <div v-else-if="activeTab === 'Risk Profile'">
            <div class="bg-white rounded-xl border border-black/[0.07] shadow-card overflow-hidden">
              <div class="px-5 py-3.5 border-b border-black/[0.05]">
                <h3 class="text-[13px] font-semibold text-primary-800">Extracted Risk Profile</h3>
              </div>
              <table class="w-full text-left text-[13px]">
                <thead>
                  <tr class="border-b border-black/[0.05] bg-surface-50">
                    <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/60">Field</th>
                    <th class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/60">Value</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-black/[0.04]">
                  <tr v-for="(raw, key) in verdict.risk_profile" :key="key" class="hover:bg-surface-50 transition-colors">
                    <td class="px-5 py-3 text-[12px] font-semibold text-black/55 uppercase tracking-[0.06em] w-48 align-top">{{ formatKey(key) }}</td>
                    <td class="px-5 py-3 align-top">
                      <span v-if="!rpIsBlank(raw)" class="text-[13px] text-black/75 leading-relaxed">{{ rpValue(raw) }}</span>
                      <span v-else class="text-black/25">—</span>
                      <p v-if="rpSource(raw)" class="text-[11px] text-black/35 mt-0.5">{{ rpSource(raw) }}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- No verdict -->
        <div v-else class="bg-white rounded-xl border border-black/[0.07] shadow-card p-16 text-center">
          <template v-if="submission?.status === 'error'">
            <p class="text-[14px] font-semibold text-danger-700 mb-4">Evaluation failed</p>
            <button
              class="bg-accent-500 hover:bg-accent-400 text-primary-800 px-5 py-2.5 rounded-md text-[13px] font-semibold transition-colors disabled:opacity-50"
              :disabled="isEvaluating"
              @click="runEvaluation"
            >
              {{ isEvaluating ? "Evaluating..." : "Retry Evaluation" }}
            </button>
          </template>
          <template v-else>
            <p class="text-[14px] font-semibold text-black/50 mb-4">
              {{ submission?.status === "processing" ? "Analysis in progress..." : "Not yet evaluated" }}
            </p>
            <button
              class="bg-accent-500 hover:bg-accent-400 text-primary-800 px-5 py-2.5 rounded-md text-[13px] font-semibold transition-colors disabled:opacity-50"
              :disabled="isEvaluating"
              @click="runEvaluation"
            >
              {{ isEvaluating ? "Evaluating..." : "Run Evaluation" }}
            </button>
          </template>
          <p v-if="evalError" class="mt-3 text-[13px] text-danger-700">{{ evalError }}</p>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

type Verdict = {
  decision: "PROCEED" | "REFER" | "DECLINE";
  composite_score: number;
  dimension_scores: Record<string, number>;
  recommendation: { summary: string; action_items: string[] };
  flags: Array<{ title: string; type: string; explanation: string; action_required: string; cited_section: string }>;
  favorable_factors: string[];
  guideline_checks: Array<{ rule: string; required: string; submitted: string; status: string; cited_section: string }>;
  insights: Record<string, string>;
  missing_info: Array<{ label: string; description: string }>;
  risk_profile: Record<string, { value: string; source?: string } | string>;
  analyzed_in_seconds?: string;
};
type SubmissionResponse = {
  id: string;
  org_id: string;
  status: string;
  source: string;
  broker_email: string | null;
  created_at: string;
  extracted_fields?: Record<string, any> | null;
  verdict: Verdict | null;
};

const route = useRoute();
const id = route.params.id as string;
const submission = ref<SubmissionResponse | null>(null);
const verdict = computed(() => submission.value?.verdict ?? null);
const namedInsured = computed(
  () => submission.value?.named_insured || (verdict.value?.risk_profile?.named_insured as string | undefined) || null
);
const isLoading = ref(false);
const loadError = ref<string | null>(null);
const isEvaluating = ref(false);
const evalError = ref<string | null>(null);
const isDownloading = ref(false);
const tabs = ["Summary", "Guidelines", "Insights", "Risk Profile"] as const;
const activeTab = ref<(typeof tabs)[number]>("Summary");

const sortedFlags = computed(() => {
  if (!verdict.value?.flags) return [];
  return [...verdict.value.flags].sort((a, b) => {
    if (a.type === "CONDITION" && b.type !== "CONDITION") return -1;
    if (a.type !== "CONDITION" && b.type === "CONDITION") return 1;
    return 0;
  });
});
const decisionTextClass = computed(() => {
  if (verdict.value?.decision === "PROCEED") return "text-success-700";
  if (verdict.value?.decision === "REFER") return "text-accent-600";
  return "text-danger-700";
});

function formatKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function rpValue(v: { value: string; source?: string } | string): string {
  return typeof v === "object" ? v.value : v;
}
function rpSource(v: { value: string; source?: string } | string): string | null {
  if (typeof v !== "object") return null;
  return v.source && v.source !== "Not disclosed" ? v.source : null;
}
function rpIsBlank(v: { value: string; source?: string } | string): boolean {
  const val = rpValue(v);
  return !val || val === "null" || val === "N/A" || val === "Not disclosed";
}
// Handles both legacy 0-100 scores and new 0-10 scores
function normalizeScore(score: number): number {
  return score > 10 ? Math.round(score) / 10 : score;
}
async function load() {
  isLoading.value = true;
  loadError.value = null;
  try {
    submission.value = await $fetch<SubmissionResponse>(`/api/submissions/${id}`);
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || "Failed to load";
  } finally {
    isLoading.value = false;
  }
}
async function runEvaluation() {
  isEvaluating.value = true;
  evalError.value = null;
  try {
    await $fetch(`/api/submissions/${id}/evaluate`, { method: "POST" });
    await load();
  } catch (e: any) {
    evalError.value = e?.data?.message || e?.message || "Evaluation failed";
  } finally {
    isEvaluating.value = false;
  }
}
async function downloadPdf() {
  isDownloading.value = true;
  try {
    const blob = await $fetch<Blob>(`/api/submissions/${id}/pdf`, { responseType: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `submission_review.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e: any) {
    console.error("PDF download failed:", e?.message);
  } finally {
    isDownloading.value = false;
  }
}
onMounted(load);
</script>
