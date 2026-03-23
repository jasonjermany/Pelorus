<template>
  <div class="min-h-screen bg-surface-50">
    <header class="border-b border-primary-700/20 bg-primary-700">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <div>
          <NuxtLink to="/" class="mb-1 inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white">
            &larr; Inbox
          </NuxtLink>
          <h1 class="text-2xl font-semibold text-white">Submission Review</h1>
        </div>
        <button
          v-if="verdict"
          class="rounded-full bg-success-600 px-4 py-2 text-sm font-semibold text-white hover:bg-success-700"
        >
          Approve &amp; Quote
        </button>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-6 py-8">
      <div v-if="isLoading" class="py-10 text-center text-sm text-slate-500">Loading...</div>
      <div v-else-if="loadError" class="py-10 text-center text-sm text-danger-700">{{ loadError }}</div>

      <template v-else>
        <!-- Decision banner -->
        <div
          v-if="verdict"
          class="mb-6 flex items-center justify-between rounded-xl px-6 py-4"
          :class="{
            'bg-success-50 border border-success-200': verdict.decision === 'PROCEED',
            'bg-accent-500/10 border border-accent-500/30': verdict.decision === 'REFER',
            'bg-danger-50 border border-danger-200': verdict.decision === 'DECLINE',
          }"
        >
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider" :class="decisionTextClass">Decision</p>
            <p class="mt-0.5 text-2xl font-bold" :class="decisionTextClass">{{ verdict.decision }}</p>
            <p class="mt-1 text-sm text-slate-700">{{ verdict.recommendation?.summary }}</p>
            <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              <span v-if="submission?.extracted_fields?.insured_name" class="font-medium">{{ submission.extracted_fields.insured_name }}</span>
              <span v-if="verdict.risk_profile?.tiv && verdict.risk_profile.tiv !== 'N/A'">TIV: {{ verdict.risk_profile.tiv }}</span>
              <span
                v-if="verdict.analyzed_in_seconds"
                class="rounded-full bg-slate-200/70 px-2 py-0.5 text-xs font-medium text-slate-600"
              >
                Analyzed in {{ verdict.analyzed_in_seconds }}s
              </span>
            </div>
          </div>
          <div class="text-right">
            <p class="text-3xl font-bold" :class="decisionTextClass">{{ verdict.composite_score }}</p>
            <p class="text-xs text-slate-500">composite score</p>
          </div>
        </div>

        <!-- Score bars -->
        <div v-if="verdict?.dimension_scores" class="mb-6 rounded-xl border border-primary-700/15 bg-white p-5 shadow-sm">
          <h3 class="mb-4 text-sm font-semibold text-primary-700">Dimension Scores</h3>
          <div class="grid gap-3 sm:grid-cols-2">
            <div v-for="(score, key) in verdict.dimension_scores" :key="key">
              <div class="mb-1 flex justify-between text-xs">
                <span class="font-medium text-slate-600">{{ formatKey(key) }}</span>
                <span class="font-semibold text-slate-800">{{ score }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-2 rounded-full transition-all"
                  :class="score >= 75 ? 'bg-success-500' : score >= 50 ? 'bg-accent-500' : 'bg-danger-500'"
                  :style="{ width: `${score}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div v-if="verdict">
          <div class="mb-4 flex gap-1 rounded-xl border border-primary-700/15 bg-white p-1 shadow-sm">
            <button
              v-for="tab in tabs"
              :key="tab"
              class="flex-1 rounded-lg py-2 text-sm font-semibold transition"
              :class="activeTab === tab ? 'bg-primary-700 text-white' : 'text-slate-600 hover:bg-slate-100'"
              @click="activeTab = tab"
            >
              {{ tab }}
            </button>
          </div>

          <!-- Summary tab -->
          <div v-if="activeTab === 'Summary'" class="space-y-4">
            <div class="rounded-xl bg-primary-700 p-5 text-white shadow-sm">
              <h3 class="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-300">Recommended Next Action</h3>
              <p class="mb-3 text-sm text-slate-100">{{ verdict.recommendation?.summary }}</p>
              <ol class="space-y-1.5 pl-1">
                <li
                  v-for="(item, i) in verdict.recommendation?.action_items"
                  :key="i"
                  class="flex items-start gap-2 text-sm text-slate-200"
                >
                  <span class="shrink-0 font-semibold text-accent-400">{{ i + 1 }}.</span> {{ item }}
                </li>
                <li v-if="!verdict.recommendation?.action_items?.length" class="text-sm text-slate-400">No action items.</li>
              </ol>
            </div>

            <div v-if="sortedFlags.length" class="space-y-3">
              <h3 class="text-sm font-semibold text-primary-700">Concerns &amp; Flags</h3>
              <div
                v-for="(flag, i) in sortedFlags"
                :key="i"
                class="rounded-xl border p-4"
                :class="flag.type === 'CONDITION' ? 'border-danger-200 bg-danger-50' : 'border-accent-500/30 bg-accent-500/5'"
              >
                <div class="flex items-start justify-between gap-3">
                  <p class="text-sm font-semibold" :class="flag.type === 'CONDITION' ? 'text-danger-800' : 'text-accent-700'">{{ flag.title }}</p>
                  <span
                    class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    :class="flag.type === 'CONDITION' ? 'bg-danger-500/15 text-danger-700' : 'bg-accent-500/15 text-accent-600'"
                  >
                    {{ flag.type }}
                  </span>
                </div>
                <p class="mt-2 text-xs text-slate-600">{{ flag.explanation }}</p>
                <p class="mt-1 text-xs font-medium text-slate-700">Action: {{ flag.action_required }}</p>
                <p class="mt-1 text-xs text-slate-500">Ref: {{ flag.cited_section }}</p>
              </div>
            </div>

            <div v-if="verdict.favorable_factors?.length" class="rounded-xl border border-success-200 bg-success-50 p-5">
              <h3 class="mb-3 text-sm font-semibold text-success-700">Favorable Factors</h3>
              <ul class="space-y-1">
                <li v-for="(f, i) in verdict.favorable_factors" :key="i" class="flex items-start gap-2 text-sm text-success-800">
                  <span class="mt-0.5">&#10003;</span> {{ f }}
                </li>
              </ul>
            </div>

            <div v-if="verdict.risk_profile" class="overflow-hidden rounded-xl border border-primary-700/15 bg-white shadow-sm">
              <div class="border-b border-primary-700/10 px-5 py-3">
                <h3 class="text-sm font-semibold text-primary-700">Risk Summary for Quoting</h3>
              </div>
              <table class="min-w-full text-left text-sm">
                <tbody class="divide-y divide-primary-700/10">
                  <tr v-for="(value, key) in verdict.risk_profile" :key="key">
                    <td class="w-40 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{{ formatKey(key) }}</td>
                    <td class="px-5 py-2 text-slate-700">
                      <span v-if="value && value !== 'null' && value !== 'N/A'">{{ value }}</span>
                      <span v-else class="text-slate-400">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Guidelines tab -->
          <div v-else-if="activeTab === 'Guidelines'">
            <div class="overflow-hidden rounded-xl border border-primary-700/15 bg-white shadow-sm">
              <div class="border-b border-primary-700/10 px-5 py-3">
                <p class="text-xs text-slate-500">
                  <span v-if="verdict.guideline_checks?.length">{{ verdict.guideline_checks.length }} check{{ verdict.guideline_checks.length !== 1 ? 's' : '' }} require attention</span>
                  <span v-else class="text-success-700">All checks passed</span>
                </p>
              </div>
              <table class="min-w-full text-left text-sm">
                <thead>
                  <tr class="border-b border-primary-700/10 text-xs uppercase tracking-wide text-primary-700/70">
                    <th class="px-5 py-3 font-semibold">Rule</th>
                    <th class="px-5 py-3 font-semibold">Required</th>
                    <th class="px-5 py-3 font-semibold">Submitted</th>
                    <th class="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-primary-700/10">
                  <tr v-for="(check, i) in verdict.guideline_checks" :key="i" class="text-sm">
                    <td class="px-5 py-3">
                      <p class="font-medium text-slate-800">{{ check.rule }}</p>
                      <p class="mt-0.5 text-xs text-slate-500">{{ check.cited_section }}</p>
                    </td>
                    <td class="px-5 py-3 text-slate-600">{{ check.required }}</td>
                    <td class="px-5 py-3 text-slate-600">{{ check.submitted }}</td>
                    <td class="px-5 py-3">
                      <span
                        class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        :class="{
                          'bg-success-500/15 text-success-700': check.status === 'pass',
                          'bg-accent-500/15 text-accent-600': check.status === 'review',
                          'bg-danger-500/15 text-danger-700': check.status === 'fail',
                        }"
                      >
                        {{ check.status }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="!verdict.guideline_checks?.length">
                    <td colspan="4" class="px-5 py-6 text-center text-sm text-slate-500">No guideline checks available.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Insights tab -->
          <div v-else-if="activeTab === 'Insights'" class="space-y-4">
            <div v-if="verdict.insights" class="grid gap-4 sm:grid-cols-2">
              <div
                v-for="(value, key) in verdict.insights"
                :key="key"
                class="rounded-xl border border-primary-700/15 bg-white p-4 shadow-sm"
              >
                <p class="text-xs font-semibold uppercase tracking-wider text-primary-700/70">{{ formatKey(key) }}</p>
                <p class="mt-2 text-sm text-slate-700">{{ value }}</p>
              </div>
            </div>

            <div v-if="verdict.missing_info?.length" class="rounded-xl border border-accent-500/30 bg-accent-500/5 p-5">
              <h3 class="mb-3 text-sm font-semibold text-accent-700">Missing Information</h3>
              <div class="space-y-3">
                <div v-for="(item, i) in verdict.missing_info" :key="i">
                  <p class="text-sm font-medium text-accent-700">{{ item.label }}</p>
                  <p class="text-xs text-slate-600">{{ item.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Risk Profile tab -->
          <div v-else-if="activeTab === 'Risk Profile'">
            <div class="overflow-hidden rounded-xl border border-primary-700/15 bg-white shadow-sm">
              <table class="min-w-full text-left text-sm">
                <thead>
                  <tr class="border-b border-primary-700/10 text-xs uppercase tracking-wide text-primary-700/70">
                    <th class="px-5 py-3 font-semibold">Field</th>
                    <th class="px-5 py-3 font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-primary-700/10">
                  <tr v-for="(value, key) in verdict.risk_profile" :key="key">
                    <td class="px-5 py-3 font-medium text-slate-700">{{ formatKey(key) }}</td>
                    <td class="px-5 py-3 text-slate-600">
                      <span v-if="value && value !== 'null' && value !== 'N/A'">{{ value }}</span>
                      <span v-else class="text-slate-400">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- No verdict yet -->
        <div v-else class="rounded-xl border border-primary-700/15 bg-white p-10 text-center shadow-sm">
          <template v-if="submission?.status === 'error'">
            <p class="text-sm font-semibold text-danger-700">Evaluation failed</p>
            <button
              class="mt-4 rounded-full bg-accent-500 px-5 py-2 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-50"
              :disabled="isEvaluating"
              @click="runEvaluation"
            >
              {{ isEvaluating ? 'Evaluating...' : 'Retry Evaluation' }}
            </button>
          </template>
          <template v-else>
            <p class="text-sm font-semibold text-slate-700">{{ submission?.status === 'processing' ? 'Stuck in processing' : 'Not yet evaluated' }}</p>
            <button
              class="mt-4 rounded-full bg-accent-500 px-5 py-2 text-sm font-semibold text-white hover:bg-accent-600 disabled:opacity-50"
              :disabled="isEvaluating"
              @click="runEvaluation"
            >
              {{ isEvaluating ? 'Evaluating...' : 'Run Evaluation' }}
            </button>
          </template>
          <p v-if="evalError" class="mt-3 text-sm text-danger-700">{{ evalError }}</p>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type Verdict = {
  decision: 'PROCEED' | 'REFER' | 'DECLINE'
  composite_score: number
  dimension_scores: Record<string, number>
  recommendation: { summary: string; action_items: string[] }
  flags: Array<{ title: string; type: string; explanation: string; action_required: string; cited_section: string }>
  favorable_factors: string[]
  guideline_checks: Array<{ rule: string; required: string; submitted: string; status: string; cited_section: string }>
  insights: Record<string, string>
  missing_info: Array<{ label: string; description: string }>
  risk_profile: Record<string, string>
  analyzed_in_seconds?: string
}

type SubmissionResponse = {
  id: string
  org_id: string
  status: string
  source: string
  broker_email: string | null
  created_at: string
  extracted_fields?: Record<string, any> | null
  verdict: Verdict | null
}

const route = useRoute()
const id = route.params.id as string

const submission = ref<SubmissionResponse | null>(null)
const verdict = computed(() => submission.value?.verdict ?? null)
const isLoading = ref(false)
const loadError = ref<string | null>(null)
const isEvaluating = ref(false)
const evalError = ref<string | null>(null)

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

const decisionTextClass = computed(() => {
  if (verdict.value?.decision === 'PROCEED') return 'text-success-700'
  if (verdict.value?.decision === 'REFER') return 'text-accent-600'
  return 'text-danger-700'
})

function formatKey(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

async function load() {
  isLoading.value = true
  loadError.value = null
  try {
    submission.value = await $fetch<SubmissionResponse>(`/api/submissions/${id}`)
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

onMounted(load)
</script>
