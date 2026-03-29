<template>
  <div class="min-h-screen bg-surface-50 font-sans">
    <!-- Header -->
    <header class="sticky top-0 z-50 bg-primary-800 border-b border-white/5">
      <div
        class="mx-auto max-w-5xl px-8 py-3.5 flex items-center justify-between gap-4"
      >
        <div class="flex flex-col gap-1.5">
          <NuxtLink
            to="/"
            class="text-[11px] text-white/35 hover:text-white/70 transition-colors tracking-[0.02em]"
            >← Inbox</NuxtLink
          >
          <div class="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <circle
                cx="16"
                cy="16"
                r="15"
                stroke="white"
                stroke-opacity="0.3"
                stroke-width="1.5"
              />
              <circle
                cx="16"
                cy="16"
                r="6"
                stroke="white"
                stroke-opacity="0.3"
                stroke-width="1.5"
              />
              <line
                x1="16"
                y1="1"
                x2="16"
                y2="7"
                stroke="white"
                stroke-opacity="0.3"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <line
                x1="16"
                y1="25"
                x2="16"
                y2="31"
                stroke="white"
                stroke-opacity="0.3"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <line
                x1="1"
                y1="16"
                x2="7"
                y2="16"
                stroke="white"
                stroke-opacity="0.3"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <line
                x1="25"
                y1="16"
                x2="31"
                y2="16"
                stroke="white"
                stroke-opacity="0.3"
                stroke-width="1.5"
                stroke-linecap="round"
              />
              <line
                x1="16"
                y1="10"
                x2="20"
                y2="16"
                stroke="#c9a84c"
                stroke-width="2"
                stroke-linecap="round"
              />
              <circle cx="16" cy="16" r="2" fill="#c9a84c" />
            </svg>
            <span class="font-sans text-[17px] text-white tracking-[-0.3px]"
              >Submission Review</span
            >
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-8 py-8 flex flex-col gap-4">
      <div v-if="isLoading" class="py-16 text-center text-[13px] text-black/30">
        Loading...
      </div>
      <div
        v-else-if="loadError"
        class="py-16 text-center text-[13px] text-danger-700"
      >
        {{ loadError }}
      </div>

      <template v-else>
        <!-- Decision Banner -->
        <div
          v-if="verdict"
          class="flex items-start justify-between gap-6 rounded-xl px-7 py-5 border"
          :class="{
            'bg-success-500/[0.04] border-success-500/20':
              verdict.decision === 'PROCEED',
            'bg-accent-500/[0.06] border-accent-500/20':
              verdict.decision === 'REFER',
            'bg-danger-500/[0.04] border-danger-500/15':
              verdict.decision === 'DECLINE',
          }"
        >
          <div class="flex-1 min-w-0">
            <span
              class="block text-[10px] font-bold tracking-[0.12em] uppercase text-black/35 mb-1"
              >Decision</span
            >
            <span
              class="block font-sans text-[26px] tracking-[-0.5px] mb-2"
              :class="decisionTextClass"
              >{{ verdict.decision }}</span
            >
            <p
              class="text-[13px] text-black/55 leading-relaxed mb-3 font-light"
            >
              {{ verdict.recommendation?.summary }}
            </p>
            <div class="flex items-center flex-wrap gap-2.5">
              <span
                v-if="
                  verdict.risk_profile?.tiv &&
                  verdict.risk_profile.tiv !== 'N/A'
                "
                class="text-[12px] text-black/40"
                >TIV: {{ verdict.risk_profile.tiv }}</span
              >
              <span
                v-if="verdict.analyzed_in_seconds"
                class="bg-black/[0.06] text-[11px] text-black/45 font-medium px-2.5 py-1 rounded-full"
                >Analyzed in {{ verdict.analyzed_in_seconds }}s</span
              >
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <span
              class="block font-sans text-[42px] tracking-[-2px] leading-none"
              :class="decisionTextClass"
              >{{ verdict.composite_score }}</span
            >
            <span class="block text-[11px] text-black/30 mt-1"
              >composite score</span
            >
          </div>
        </div>

        <!-- Dimension Scores -->
        <div
          v-if="verdict?.dimension_scores"
          class="bg-white rounded-xl border border-black/[0.07] shadow-card p-5"
        >
          <h3 class="text-[12px] font-semibold text-primary-800 mb-4">
            Dimension Scores
          </h3>
          <div class="grid grid-cols-2 gap-x-8 gap-y-3">
            <div v-for="(score, key) in verdict.dimension_scores" :key="key">
              <div class="flex justify-between mb-1.5">
                <span class="text-[12px] font-medium text-black/50">{{
                  formatKey(key)
                }}</span>
                <span class="text-[12px] font-bold text-primary-800">{{
                  score
                }}</span>
              </div>
              <div class="h-1.5 bg-black/[0.06] rounded-full overflow-hidden">
                <div
                  class="h-1.5 rounded-full transition-all duration-500"
                  :class="
                    score >= 75
                      ? 'bg-success-500'
                      : score >= 50
                        ? 'bg-accent-500'
                        : 'bg-danger-500'
                  "
                  :style="{ width: `${score}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div v-if="verdict">
          <div
            class="flex gap-1 bg-white rounded-xl border border-black/[0.07] shadow-card p-1 mb-4"
          >
            <button
              v-for="tab in tabs"
              :key="tab"
              class="flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-all"
              :class="
                activeTab === tab
                  ? 'bg-primary-800 text-white'
                  : 'text-black/40 hover:bg-surface-50 hover:text-primary-800'
              "
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <!-- Summary -->
          <div v-if="activeTab === 'Summary'" class="flex flex-col gap-4">
            <!-- Action box -->
            <div class="bg-primary-800 rounded-xl p-6">
              <p
                class="text-[10px] font-bold tracking-[0.12em] uppercase text-white/35 mb-1.5"
              >
                Recommended Next Action
              </p>
              <p
                class="text-[14px] text-white/80 leading-relaxed mb-4 font-light"
              >
                {{ verdict.recommendation?.summary }}
              </p>
              <ol class="flex flex-col gap-2 list-none">
                <li
                  v-for="(item, i) in verdict.recommendation?.action_items"
                  :key="i"
                  class="flex gap-2.5 text-[13px] text-white/60 leading-relaxed"
                >
                  <span class="text-accent-500 font-bold flex-shrink-0"
                    >{{ i + 1 }}.</span
                  >{{ item }}
                </li>
              </ol>
            </div>

            <!-- Flags -->
            <div v-if="sortedFlags.length" class="flex flex-col gap-2.5">
              <h3 class="text-[13px] font-semibold text-primary-800">
                Concerns &amp; Flags
              </h3>
              <div
                v-for="(flag, i) in sortedFlags"
                :key="i"
                class="rounded-xl border p-4"
                :class="
                  flag.type === 'CONDITION'
                    ? 'bg-danger-500/[0.03] border-danger-500/15'
                    : 'bg-accent-500/[0.05] border-accent-500/15'
                "
              >
                <div class="flex items-start justify-between gap-3 mb-2">
                  <p class="text-[13px] font-semibold text-primary-800">
                    {{ flag.title }}
                  </p>
                  <span
                    class="flex-shrink-0 text-[10px] font-bold tracking-[0.06em] px-2.5 py-1 rounded-full"
                    :class="
                      flag.type === 'CONDITION'
                        ? 'bg-danger-500/10 text-danger-700'
                        : 'bg-accent-500/15 text-accent-600'
                    "
                    >{{ flag.type }}</span
                  >
                </div>
                <p
                  class="text-[12px] text-black/50 leading-relaxed mb-1.5 font-light"
                >
                  {{ flag.explanation }}
                </p>
                <p class="text-[12px] text-black/60 font-medium mb-1">
                  <strong>Action:</strong> {{ flag.action_required }}
                </p>
                <p class="text-[11px] text-black/30">
                  Ref: {{ flag.cited_section }}
                </p>
              </div>
            </div>

            <!-- Favorable factors -->
            <div
              v-if="verdict.favorable_factors?.length"
              class="bg-white rounded-xl border border-black/[0.07] shadow-card p-5"
            >
              <h3 class="text-[13px] font-semibold text-success-700 mb-3">
                Favorable Factors
              </h3>
              <ul class="flex flex-col gap-2 list-none">
                <li
                  v-for="(f, i) in verdict.favorable_factors"
                  :key="i"
                  class="flex items-start gap-2 text-[13px] text-black/60 font-light leading-relaxed"
                >
                  <span class="text-success-500 font-bold flex-shrink-0 mt-0.5"
                    >✓</span
                  >{{ f }}
                </li>
              </ul>
            </div>

            <!-- Risk Summary -->
            <div
              v-if="verdict.risk_profile"
              class="bg-white rounded-xl border border-black/[0.07] shadow-card overflow-hidden"
            >
              <div class="px-5 py-3.5 border-b border-black/[0.05]">
                <h3 class="text-[13px] font-semibold text-primary-800">
                  Risk Summary for Quoting
                </h3>
              </div>
              <table class="w-full text-left text-[13px]">
                <tbody class="divide-y divide-black/[0.04]">
                  <tr
                    v-for="(value, key) in verdict.risk_profile"
                    :key="key"
                    class="hover:bg-surface-50 transition-colors"
                  >
                    <td
                      class="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-black/35 w-40 align-top"
                    >
                      {{ formatKey(key) }}
                    </td>
                    <td
                      class="px-5 py-2.5 text-black/60 font-light leading-relaxed align-top"
                    >
                      <span
                        v-if="value && value !== 'null' && value !== 'N/A'"
                        >{{ value }}</span
                      >
                      <span v-else class="text-black/20">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Guidelines -->
          <div v-else-if="activeTab === 'Guidelines'">
            <div
              class="bg-white rounded-xl border border-black/[0.07] shadow-card overflow-hidden"
            >
              <div class="px-5 py-3.5 border-b border-black/[0.05]">
                <p class="text-[12px] text-black/40">
                  <span v-if="verdict.guideline_checks?.length"
                    >{{ verdict.guideline_checks.length }} check{{
                      verdict.guideline_checks.length !== 1 ? "s" : ""
                    }}
                    require attention</span
                  >
                  <span v-else class="text-success-700 font-medium"
                    >All checks passed</span
                  >
                </p>
              </div>
              <table class="w-full text-left text-[13px]">
                <thead>
                  <tr class="border-b border-black/[0.05]">
                    <th
                      class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/30"
                    >
                      Rule
                    </th>
                    <th
                      class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/30"
                    >
                      Required
                    </th>
                    <th
                      class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/30"
                    >
                      Submitted
                    </th>
                    <th
                      class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/30 w-24"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-black/[0.04]">
                  <tr
                    v-for="(check, i) in verdict.guideline_checks"
                    :key="i"
                    class="hover:bg-surface-50 transition-colors"
                    :class="{
                      'bg-danger-500/[0.02]': check.status === 'fail',
                      'bg-accent-500/[0.02]': check.status === 'review',
                    }"
                  >
                    <td class="px-5 py-3 align-top">
                      <p class="font-semibold text-primary-800 text-[13px]">
                        {{ check.rule }}
                      </p>
                      <p class="text-[10px] text-black/30 mt-0.5">
                        {{ check.cited_section }}
                      </p>
                    </td>
                    <td
                      class="px-5 py-3 text-[12px] text-black/50 font-light leading-relaxed align-top"
                    >
                      {{ check.required }}
                    </td>
                    <td
                      class="px-5 py-3 text-[12px] text-black/50 font-light leading-relaxed align-top"
                    >
                      {{ check.submitted }}
                    </td>
                    <td class="px-5 py-3 align-top">
                      <span
                        class="text-[10px] font-bold tracking-[0.06em] px-2.5 py-1 rounded-full whitespace-nowrap"
                        :class="{
                          'bg-success-500/10 text-success-700':
                            check.status === 'pass',
                          'bg-accent-500/15 text-accent-600':
                            check.status === 'review',
                          'bg-danger-500/10 text-danger-700':
                            check.status === 'fail',
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
            <div v-if="verdict.insights" class="grid grid-cols-2 gap-4">
              <div
                v-for="(value, key) in verdict.insights"
                :key="key"
                class="bg-white rounded-xl border border-black/[0.07] shadow-card p-5"
              >
                <p
                  class="text-[10px] font-bold uppercase tracking-[0.1em] text-black/30 mb-2"
                >
                  {{ formatKey(key) }}
                </p>
                <p class="text-[13px] text-black/60 leading-relaxed font-light">
                  {{ value }}
                </p>
              </div>
            </div>
            <div
              v-if="verdict.missing_info?.length"
              class="bg-white rounded-xl border border-black/[0.07] shadow-card p-5"
            >
              <h3 class="text-[13px] font-semibold text-accent-600 mb-4">
                Missing Information
              </h3>
              <div class="flex flex-col gap-4">
                <div v-for="(item, i) in verdict.missing_info" :key="i">
                  <p class="text-[13px] font-semibold text-primary-800 mb-1">
                    {{ item.label }}
                  </p>
                  <p
                    class="text-[12px] text-black/50 leading-relaxed font-light"
                  >
                    {{ item.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Risk Profile -->
          <div v-else-if="activeTab === 'Risk Profile'">
            <div
              class="bg-white rounded-xl border border-black/[0.07] shadow-card overflow-hidden"
            >
              <table class="w-full text-left text-[13px]">
                <thead>
                  <tr class="border-b border-black/[0.05]">
                    <th
                      class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/30"
                    >
                      Field
                    </th>
                    <th
                      class="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-black/30"
                    >
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-black/[0.04]">
                  <tr
                    v-for="(value, key) in verdict.risk_profile"
                    :key="key"
                    class="hover:bg-surface-50 transition-colors"
                  >
                    <td
                      class="px-5 py-3 text-[12px] font-semibold text-black/40 uppercase tracking-[0.06em] w-48 align-top"
                    >
                      {{ formatKey(key) }}
                    </td>
                    <td
                      class="px-5 py-3 text-[13px] text-black/60 font-light leading-relaxed align-top"
                    >
                      <span
                        v-if="value && value !== 'null' && value !== 'N/A'"
                        >{{ value }}</span
                      >
                      <span v-else class="text-black/20">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- No verdict -->
        <div
          v-else
          class="bg-white rounded-xl border border-black/[0.07] shadow-card p-16 text-center"
        >
          <template v-if="submission?.status === 'error'">
            <p class="text-[14px] font-semibold text-danger-700 mb-4">
              Evaluation failed
            </p>
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
              {{
                submission?.status === "processing"
                  ? "Analysis in progress..."
                  : "Not yet evaluated"
              }}
            </p>
            <button
              class="bg-accent-500 hover:bg-accent-400 text-primary-800 px-5 py-2.5 rounded-md text-[13px] font-semibold transition-colors disabled:opacity-50"
              :disabled="isEvaluating"
              @click="runEvaluation"
            >
              {{ isEvaluating ? "Evaluating..." : "Run Evaluation" }}
            </button>
          </template>
          <p v-if="evalError" class="mt-3 text-[13px] text-danger-700">
            {{ evalError }}
          </p>
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
  flags: Array<{
    title: string;
    type: string;
    explanation: string;
    action_required: string;
    cited_section: string;
  }>;
  favorable_factors: string[];
  guideline_checks: Array<{
    rule: string;
    required: string;
    submitted: string;
    status: string;
    cited_section: string;
  }>;
  insights: Record<string, string>;
  missing_info: Array<{ label: string; description: string }>;
  risk_profile: Record<string, string>;
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
const isLoading = ref(false);
const loadError = ref<string | null>(null);
const isEvaluating = ref(false);
const evalError = ref<string | null>(null);
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
async function load() {
  isLoading.value = true;
  loadError.value = null;
  try {
    submission.value = await $fetch<SubmissionResponse>(
      `/api/submissions/${id}`,
    );
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
onMounted(load);
</script>
