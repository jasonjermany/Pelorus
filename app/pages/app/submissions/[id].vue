<template>
  <div class="min-h-screen bg-[#f5f5f7] font-sans">
    <!-- Header -->
    <AppHeader variant="app">
      <div class="mx-auto max-w-4xl px-8 py-3.5 flex items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <NuxtLink to="/app" class="text-[13px] text-white/60 hover:text-white/90 transition-colors tracking-[0.02em]">← Inbox</NuxtLink>
          <div class="flex items-center gap-2.5">
            <img src="/PelorusLogo.png" width="28" height="28" alt="Pelorus" />
            <span class="font-sans text-[20px] font-semibold text-white tracking-[-0.3px]">
              {{ namedInsured || 'Submission Review' }}
            </span>
          </div>
        </div>
        <button
          v-if="verdict"
          class="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[13px] font-medium transition-colors disabled:opacity-50"
          :disabled="isDownloading"
          @click="downloadPdf"
        >
          <svg v-if="!isDownloading" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          {{ isDownloading ? 'Generating...' : 'Download PDF' }}
        </button>
      </div>
    </AppHeader>

    <main class="mx-auto max-w-4xl px-8 py-8 flex flex-col gap-5">
      <div v-if="isLoading" class="py-16 text-center text-[13px] text-black/30">Loading...</div>
      <div v-else-if="loadError" class="py-16 text-center text-[13px] text-danger-700">{{ loadError }}</div>

      <template v-else>

        <!-- Decision Card -->
        <div
          v-if="verdict"
          class="rounded-2xl p-7"
          :style="decisionCardStyle"
        >
          <div class="flex items-start justify-between gap-6">
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-semibold tracking-[0.1em] uppercase mb-3" :style="{ color: decisionColors.label }">Decision</p>
              <!-- Decision pill -->
              <span
                class="inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-semibold tracking-[0.02em] mb-4"
                :style="{ background: decisionColors.pillBg, color: decisionColors.pillText }"
              >{{ verdict.decision }}</span>
              <p class="text-[14px] leading-[1.6] mb-4" :style="{ color: decisionColors.body }">{{ verdict.recommendation?.summary }}</p>
              <div class="flex items-center flex-wrap gap-2">
                <span v-if="verdict.risk_profile?.tiv && !rpIsBlank(verdict.risk_profile.tiv)" class="text-[12px]" :style="{ color: decisionColors.meta }">TIV: {{ rpValue(verdict.risk_profile.tiv) }}</span>
                <span v-if="verdict.analyzed_in_seconds" class="text-[11px] font-medium px-2.5 py-1 rounded-full" :style="{ background: decisionColors.metaBg, color: decisionColors.meta }">Analyzed in {{ verdict.analyzed_in_seconds }}s</span>
              </div>
            </div>
            <!-- Hero score -->
            <div class="flex-shrink-0 flex flex-col items-end">
              <span class="font-sans leading-none tracking-[-3px]" style="font-size: 72px; font-weight: 300;" :style="{ color: decisionColors.score }">{{ normalizeScore(verdict.composite_score).toFixed(1) }}</span>
              <span class="text-[13px] font-medium -mt-1" :style="{ color: decisionColors.scoreLabel }">out of 10</span>
            </div>
          </div>
        </div>

        <!-- Dimension Scores -->
        <div v-if="verdict?.dimension_scores" class="bg-white rounded-2xl p-6" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
          <p class="text-[11px] font-semibold tracking-[0.1em] uppercase text-black/40 mb-5">Dimension Scores</p>
          <div class="flex flex-col divide-y divide-black/[0.04]">
            <div v-for="(score, key) in verdict.dimension_scores" :key="key" class="flex items-center gap-4 py-3.5">
              <span class="text-[13px] text-black/60 w-36 flex-shrink-0">{{ formatKey(key) }}</span>
              <div class="flex-1 h-1 bg-black/[0.06] rounded-full overflow-hidden">
                <div
                  class="h-1 rounded-full transition-all duration-700"
                  :class="normalizeScore(score) >= 7.5 ? 'bg-success-500' : normalizeScore(score) >= 5.0 ? 'bg-accent-500' : 'bg-danger-500'"
                  :style="{ width: `${normalizeScore(score) * 10}%` }"
                />
              </div>
              <span class="text-[13px] font-semibold text-primary-800 w-8 text-right flex-shrink-0">{{ normalizeScore(score).toFixed(1) }}</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div v-if="verdict">
          <!-- iOS segmented control -->
          <div class="bg-black/[0.06] rounded-xl p-1 mb-5 flex gap-0.5">
            <button
              v-for="tab in tabs"
              :key="tab"
              class="flex-1 py-2 rounded-lg text-[13px] font-medium transition-all duration-200"
              :class="activeTab === tab ? 'bg-white text-primary-800 shadow-sm' : 'text-black/50 hover:text-black/70'"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <!-- Summary -->
          <div v-if="activeTab === 'Summary'" class="flex flex-col gap-4">

            <!-- Recommended Next Action -->
            <div class="bg-primary-800 rounded-2xl p-6" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
              <p class="text-[11px] font-semibold tracking-[0.1em] uppercase text-white/40 mb-3">Recommended Next Action</p>
              <ol class="flex flex-col gap-2.5 list-none">
                <li v-for="(item, i) in verdict.recommendation?.action_items" :key="i" class="flex gap-3 text-[13px] text-white/80 leading-relaxed">
                  <span class="text-accent-400 font-semibold flex-shrink-0 w-4">{{ i + 1 }}.</span>{{ item }}
                </li>
              </ol>
            </div>

            <!-- Concerns & Flags -->
            <div v-if="sortedFlags.length" class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
              <div class="px-6 py-4 flex items-center justify-between border-b border-black/[0.04]">
                <p class="text-[11px] font-semibold tracking-[0.1em] uppercase text-black/40">Concerns &amp; Flags</p>
                <span class="text-[12px] text-black/40">{{ sortedFlags.length }} item{{ sortedFlags.length !== 1 ? 's' : '' }}</span>
              </div>
              <div class="flex flex-col divide-y divide-black/[0.04]">
                <div
                  v-for="(flag, i) in sortedFlags"
                  :key="i"
                  class="px-6 py-5 flex gap-4"
                >
                  <!-- Left accent bar -->
                  <div class="w-[3px] rounded-full flex-shrink-0 mt-0.5" :class="flag.type === 'CONDITION' ? 'bg-danger-500' : 'bg-accent-400'" />
                  <div class="flex-1 min-w-0">
                    <p class="text-[14px] font-medium text-primary-800 mb-1.5">{{ flag.title }}</p>
                    <p class="text-[13px] text-black/60 leading-relaxed mb-2.5">{{ flag.explanation }}</p>
                    <p class="text-[12px] text-black/55 mb-1.5"><span class="font-semibold text-primary-800">Action:</span> {{ flag.action_required }}</p>
                    <p class="text-[11px] text-black/40"><span class="font-semibold text-primary-800">Ref:</span> {{ flag.cited_section }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Favorable Factors -->
            <div v-if="verdict.favorable_factors?.length" class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
              <div class="px-6 py-4 border-b border-black/[0.04]">
                <p class="text-[11px] font-semibold tracking-[0.1em] uppercase text-black/40">Favorable Factors</p>
              </div>
              <ul class="flex flex-col divide-y divide-black/[0.04] list-none">
                <li v-for="(f, i) in verdict.favorable_factors" :key="i" class="flex items-start gap-3 px-6 py-4 text-[13px] text-black/65 leading-relaxed">
                  <span class="text-success-500 flex-shrink-0 mt-0.5">✓</span>{{ f }}
                </li>
              </ul>
            </div>

            <!-- Risk Summary for Quoting -->
            <div v-if="verdict.risk_profile" class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
              <div class="px-6 py-4 border-b border-black/[0.04]">
                <p class="text-[11px] font-semibold tracking-[0.1em] uppercase text-black/40">Risk Summary</p>
              </div>
              <div class="divide-y divide-black/[0.04]">
                <div v-for="(raw, key) in verdict.risk_profile" :key="key" class="flex gap-4 px-6 py-3.5 hover:bg-black/[0.01] transition-colors">
                  <span class="text-[11px] font-semibold uppercase tracking-[0.06em] text-black/40 w-40 flex-shrink-0 pt-0.5">{{ formatKey(key) }}</span>
                  <div class="flex-1 min-w-0">
                    <span v-if="!rpIsBlank(raw)" class="text-[13px] text-black/75">{{ rpValue(raw) }}</span>
                    <span v-else class="text-black/20">—</span>
                    <p v-if="rpSource(raw)" class="text-[11px] text-black/40 mt-0.5"><span class="font-semibold text-primary-800">Source:</span> {{ rpSource(raw) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Guidelines -->
          <div v-else-if="activeTab === 'Guidelines'">
            <div class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
              <div class="px-6 py-4 border-b border-black/[0.04] flex items-center justify-between">
                <p class="text-[11px] font-semibold tracking-[0.1em] uppercase text-black/40">Guideline Checks</p>
                <span class="text-[12px] text-black/40">
                  <span v-if="verdict.guideline_checks?.length">{{ verdict.guideline_checks.length }} check{{ verdict.guideline_checks.length !== 1 ? "s" : "" }} require attention</span>
                  <span v-else class="text-success-700 font-medium">All checks passed</span>
                </span>
              </div>
              <table class="w-full text-left text-[13px]">
                <thead>
                  <tr class="border-b border-black/[0.04] bg-black/[0.01]">
                    <th class="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-black/40">Rule</th>
                    <th class="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-black/40">Required</th>
                    <th class="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-black/40">Submitted</th>
                    <th class="px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-black/40 w-20">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-black/[0.04]">
                  <tr
                    v-for="(check, i) in verdict.guideline_checks"
                    :key="i"
                    class="hover:bg-black/[0.01] transition-colors"
                    :class="{ 'bg-danger-500/[0.015]': check.status === 'fail', 'bg-accent-500/[0.015]': check.status === 'review' }"
                  >
                    <td class="px-6 py-4 align-top">
                      <p class="font-medium text-primary-800 text-[13px]">{{ check.rule }}</p>
                      <p class="text-[11px] text-black/40 mt-1"><span class="font-semibold text-primary-800">Ref:</span> {{ check.cited_section }}</p>
                    </td>
                    <td class="px-6 py-4 text-[13px] text-black/55 leading-relaxed align-top">{{ check.required }}</td>
                    <td class="px-6 py-4 align-top">
                      <p class="text-[13px] text-black/55 leading-relaxed">{{ check.submitted }}</p>
                      <p v-if="check.submission_source && check.submission_source !== 'Not disclosed'" class="text-[11px] text-black/40 mt-1"><span class="font-semibold text-primary-800">Source:</span> {{ check.submission_source }}</p>
                    </td>
                    <td class="px-6 py-4 align-top">
                      <span
                        class="text-[10px] font-semibold tracking-[0.04em] px-2.5 py-1 rounded-full whitespace-nowrap"
                        :class="{
                          'bg-success-500/10 text-success-700': check.status === 'pass',
                          'bg-accent-500/10 text-accent-600': check.status === 'review',
                          'bg-danger-500/10 text-danger-700': check.status === 'fail',
                        }"
                      >{{ check.status }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Insights -->
          <div v-else-if="activeTab === 'Insights'" class="flex flex-col gap-4">
            <div v-if="verdict.insights" class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
              <div class="px-6 py-4 border-b border-black/[0.04]">
                <p class="text-[11px] font-semibold tracking-[0.1em] uppercase text-black/40">Underwriting Insights</p>
              </div>
              <div class="divide-y divide-black/[0.04]">
                <div v-for="(value, key) in verdict.insights" :key="key" class="px-6 py-5">
                  <p class="text-[10px] font-semibold uppercase tracking-[0.1em] text-black/40 mb-2">{{ formatKey(key) }}</p>
                  <p class="text-[13px] text-black/65 leading-relaxed">{{ value }}</p>
                </div>
              </div>
            </div>
            <div v-if="verdict.missing_info?.length" class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
              <div class="px-6 py-4 border-b border-black/[0.04]">
                <p class="text-[11px] font-semibold tracking-[0.1em] uppercase text-black/40">Missing Information</p>
              </div>
              <div class="flex flex-col divide-y divide-black/[0.04]">
                <div v-for="(item, i) in verdict.missing_info" :key="i" class="px-6 py-4">
                  <p class="text-[13px] font-medium text-primary-800 mb-1">{{ item.label }}</p>
                  <p class="text-[13px] text-black/55 leading-relaxed">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Risk Profile -->
          <div v-else-if="activeTab === 'Risk Profile'">
            <div class="bg-white rounded-2xl overflow-hidden" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
              <div class="px-6 py-4 border-b border-black/[0.04]">
                <p class="text-[11px] font-semibold tracking-[0.1em] uppercase text-black/40">Extracted Risk Profile</p>
              </div>
              <div class="divide-y divide-black/[0.04]">
                <div v-for="(raw, key) in verdict.risk_profile" :key="key" class="flex gap-4 px-6 py-3.5 hover:bg-black/[0.01] transition-colors">
                  <span class="text-[11px] font-semibold uppercase tracking-[0.06em] text-black/40 w-44 flex-shrink-0 pt-0.5">{{ formatKey(key) }}</span>
                  <div class="flex-1 min-w-0">
                    <span v-if="!rpIsBlank(raw)" class="text-[13px] text-black/75">{{ rpValue(raw) }}</span>
                    <span v-else class="text-black/20">—</span>
                    <p v-if="rpSource(raw)" class="text-[11px] text-black/40 mt-0.5"><span class="font-semibold text-primary-800">Source:</span> {{ rpSource(raw) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No verdict -->
        <div v-else class="bg-white rounded-2xl p-16 text-center" style="box-shadow: 0 1px 3px rgba(0,0,0,0.08)">
          <template v-if="submission?.status === 'error'">
            <p class="text-[14px] font-medium text-danger-700 mb-4">Evaluation failed</p>
            <button
              class="bg-accent-500 hover:bg-accent-400 text-primary-800 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-50"
              :disabled="isEvaluating"
              @click="runEvaluation"
            >
              {{ isEvaluating ? "Evaluating..." : "Retry Evaluation" }}
            </button>
          </template>
          <template v-else>
            <p class="text-[14px] text-black/40 mb-4">
              {{ submission?.status === "processing" ? "Analysis in progress..." : "Not yet evaluated" }}
            </p>
            <button
              class="bg-accent-500 hover:bg-accent-400 text-primary-800 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors disabled:opacity-50"
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
  guideline_checks: Array<{ rule: string; required: string; submitted: string; submission_source?: string; status: string; cited_section: string }>;
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
const namedInsured = computed(() => {
  const raw = verdict.value?.risk_profile?.named_insured;
  return rpValue(raw ?? '') || null;
});
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

const decisionColors = computed(() => {
  const d = verdict.value?.decision;
  if (d === "PROCEED") return {
    bg: "#f0fdf4", label: "#15803d88", body: "#166534cc", meta: "#166534aa",
    metaBg: "#dcfce7", score: "#15803d", scoreLabel: "#15803d88",
    pillBg: "#dcfce7", pillText: "#15803d",
  };
  if (d === "REFER") return {
    bg: "#fffbeb", label: "#92400e88", body: "#78350fcc", meta: "#92400eaa",
    metaBg: "#fef3c7", score: "#b45309", scoreLabel: "#b4530988",
    pillBg: "#fef3c7", pillText: "#b45309",
  };
  return {
    bg: "#fff1f2", label: "#9f121888", body: "#9f1218cc", meta: "#9f1218aa",
    metaBg: "#fee2e2", score: "#dc2626", scoreLabel: "#dc262688",
    pillBg: "#fee2e2", pillText: "#dc2626",
  };
});

const decisionCardStyle = computed(() => ({
  background: decisionColors.value.bg,
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
}));

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
