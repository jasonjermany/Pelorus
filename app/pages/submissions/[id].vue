<template>
  <div class="min-h-screen bg-surface-50">
    <header class="border-b border-primary-700/20 bg-primary-700">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <div>
          <h1 class="text-2xl font-semibold text-white">Submission Detail</h1>
          <p class="mt-1 text-sm text-slate-200">Review extracted facts, rule outcomes, and final decision.</p>
        </div>
        <div class="flex items-center gap-2">
          <NuxtLink to="/dashboard" class="rounded-md border border-accent-500/40 bg-accent-500 px-3 py-1 text-xs font-semibold text-white">
            Dashboard
          </NuxtLink>
          <NuxtLink to="/dev" class="rounded-md border border-slate-200/50 bg-white px-3 py-1 text-xs font-semibold text-primary-700 hover:bg-slate-100">
            Dev Console
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-6 py-10">
      <p v-if="isLoading" class="text-sm text-slate-600">Loading submission...</p>
      <p v-else-if="errorMessage" class="text-sm text-danger-700">{{ errorMessage }}</p>

      <template v-else-if="submission">
        <div class="mb-6 rounded-xl border border-primary-700/15 bg-white p-5 shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold text-primary-700">{{ submission.companyName }}</h2>
              <p class="mt-1 text-xs text-slate-500">Processed {{ formatDate(submission.createdAt) }}</p>
              <p class="mt-3 text-sm text-slate-700">{{ submission.summary }}</p>
            </div>
            <span
              class="rounded-full px-3 py-1 text-xs font-semibold"
              :class="{
                'bg-success-500/15 text-success-700': submission.status === 'PASS',
                'bg-accent-500/15 text-accent-600': submission.status === 'REFER',
                'bg-danger-500/15 text-danger-700': submission.status === 'FAIL',
              }"
            >
              {{ submission.status }}
            </span>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <section class="rounded-xl border border-primary-700/15 bg-white p-5 shadow-sm">
            <h3 class="text-sm font-semibold text-primary-700">Extracted Facts</h3>
            <div class="mt-3 max-h-[24rem] space-y-3 overflow-y-auto pr-1">
              <div v-if="submission.facts.length === 0" class="text-sm text-slate-600">No facts extracted.</div>
              <div v-for="fact in submission.facts" :key="fact.field" class="rounded-lg border border-primary-700/10 p-3">
                <p class="text-sm font-semibold text-slate-900">{{ fact.field }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ fact.sourceSnippet || 'No source snippet provided.' }}</p>
                <p class="mt-1 text-sm text-slate-700">Value: {{ displayFactValue(fact.value) }}</p>
                <p class="mt-1 text-xs text-slate-500">Confidence: {{ (fact.confidence * 100).toFixed(0) }}%</p>
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-primary-700/15 bg-white p-5 shadow-sm">
            <h3 class="text-sm font-semibold text-primary-700">Additional Signals</h3>
            <div class="mt-3 max-h-[24rem] space-y-3 overflow-y-auto pr-1">
              <div v-if="submission.additionalFacts.length === 0" class="text-sm text-slate-600">No additional signals.</div>
              <div v-for="fact in submission.additionalFacts" :key="`additional-${fact.field}-${fact.sourceSnippet || ''}`" class="rounded-lg border border-primary-700/10 p-3">
                <p class="text-sm font-semibold text-slate-900">{{ fact.field }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ fact.sourceSnippet || 'No source snippet provided.' }}</p>
                <p class="mt-1 text-sm text-slate-700">Value: {{ displayFactValue(fact.value) }}</p>
                <p class="mt-1 text-xs text-slate-500">Confidence: {{ (fact.confidence * 100).toFixed(0) }}%</p>
              </div>
            </div>
          </section>
        </div>

        <div class="mt-6 grid gap-6 lg:grid-cols-3">
          <section class="rounded-xl border border-danger-200 bg-danger-50 p-5">
            <h3 class="text-sm font-semibold text-danger-700">Failed Rules</h3>
            <div class="mt-3 max-h-[24rem] space-y-3 overflow-y-auto pr-1">
              <div v-if="failedRules.length === 0" class="text-sm text-danger-700">No failed rules.</div>
              <div v-for="item in failedRules" :key="item.ruleId" class="rounded-lg border border-danger-200 bg-white p-3">
                <p class="text-sm font-semibold text-danger-800">{{ item.normalizedExpression }}</p>
                <p class="mt-1 text-xs text-danger-700">Actual: {{ displayFactValue(item.actualValue) }}</p>
                <p class="mt-1 text-xs text-danger-700">Reason: {{ item.reason }}</p>
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-accent-500/30 bg-accent-500/10 p-5">
            <h3 class="text-sm font-semibold text-accent-600">Unknown Rules</h3>
            <div class="mt-3 max-h-[24rem] space-y-3 overflow-y-auto pr-1">
              <div v-if="unknownRules.length === 0" class="text-sm text-accent-600">No unknown rules.</div>
              <div v-for="item in unknownRules" :key="item.ruleId" class="rounded-lg border border-accent-500/30 bg-white p-3">
                <p class="text-sm font-semibold text-accent-600">{{ item.normalizedExpression }}</p>
                <p class="mt-1 text-xs text-accent-600">Actual: {{ displayFactValue(item.actualValue) }}</p>
                <p class="mt-1 text-xs text-accent-600">Reason: {{ item.reason }}</p>
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-success-200 bg-success-50 p-5">
            <h3 class="text-sm font-semibold text-success-700">Passed Rules</h3>
            <div class="mt-3 max-h-[24rem] space-y-3 overflow-y-auto pr-1">
              <div v-if="passedRules.length === 0" class="text-sm text-success-700">No passed rules.</div>
              <div v-for="item in passedRules" :key="item.ruleId" class="rounded-lg border border-success-200 bg-white p-3">
                <p class="text-sm font-semibold text-success-800">{{ item.normalizedExpression }}</p>
                <p class="mt-1 text-xs text-success-700">Actual: {{ displayFactValue(item.actualValue) }}</p>
                <p class="mt-1 text-xs text-success-700">Reason: {{ item.reason }}</p>
              </div>
            </div>
          </section>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ProcessedSubmission } from '~/types/models'

type SubmissionDetailResponse = {
  submission: ProcessedSubmission
}

const route = useRoute()
const submission = ref<ProcessedSubmission | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === 'object') {
    const e = error as {
      data?: { message?: string }
      statusMessage?: string
      message?: string
    }
    return e.data?.message || e.statusMessage || e.message || 'Request failed.'
  }
  return 'Request failed.'
}

const formatDate = (iso: string) => {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString()
}

const displayFactValue = (value: unknown) => {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

const failedRules = computed(() => submission.value?.evaluation.filter((item) => item.status === 'FAIL') ?? [])
const unknownRules = computed(() => submission.value?.evaluation.filter((item) => item.status === 'UNKNOWN') ?? [])
const passedRules = computed(() => submission.value?.evaluation.filter((item) => item.status === 'PASS') ?? [])

const loadSubmission = async () => {
  isLoading.value = true
  errorMessage.value = null
  try {
    const response = await $fetch<SubmissionDetailResponse>(`/api/submissions/${route.params.id}`)
    submission.value = response.submission
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadSubmission)
</script>
