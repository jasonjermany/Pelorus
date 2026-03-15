<template>
  <div class="min-h-screen bg-surface-50">
    <header class="border-b border-primary-700/20 bg-primary-700">
      <div class="mx-auto max-w-6xl px-6 pt-10 pb-8">
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 class="text-3xl font-semibold text-white">Pelorus</h1>
              <p class="mt-2 max-w-2xl text-lg text-slate-100">
                AI-powered submission triage for underwriters.
              </p>
              <p class="mt-2 text-sm text-slate-200">
                Convert underwriting guidelines into structured rules, extract facts from submissions, and instantly see pass/fail results.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span class="rounded-full bg-accent-500 px-3 py-1 text-xs font-semibold text-white">
                MVP Prototype
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-6 pb-16">
      <div class="grid gap-6 lg:grid-cols-2">
        <Card>
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-primary-700">Underwriting Guidelines</h2>
              <p class="mt-1 text-sm text-slate-600">
                Paste your underwriting guidelines below and generate structured rules.
              </p>
            </div>
            <Badge variant="info">Step 1</Badge>
          </div>

          <textarea
            v-model="guidelines"
            class="mt-4 h-40 w-full resize-none rounded-xl border border-primary-700/20 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
          />

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <Button :variant="isGeneratingRules ? 'accent' : 'primary'" :disabled="isGeneratingRules" @click="onGenerateRules">{{ isGeneratingRules ? 'Generating...' : 'Generate Rules' }}</Button>
            <Button variant="secondary" @click="resetGuidelines">Reset</Button>
            <Button variant="ghost" @click="loadExampleGuidelines">Load Example</Button>
          </div>
          <p v-if="generateError" class="mt-3 text-sm text-danger-700">
            {{ generateError }}
          </p>

          <div class="mt-6">
            <h3 class="text-sm font-semibold text-primary-700">Structured Rules</h3>
            <p class="mt-1 text-xs text-slate-500">Rules generated from your guidelines. Each rule is evaluated against extracted facts.</p>

            <div class="mt-4 space-y-3">
              <div v-if="!rules.length" class="rounded-xl border border-dashed border-primary-700/20 bg-surface-100 p-6 text-sm text-slate-600">
                Generate rules to see them appear here.
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="rule in rules"
                  :key="rule.id"
                  class="rounded-xl border border-primary-700/15 bg-white p-4 shadow-sm"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-sm font-semibold text-slate-900">{{ rule.normalizedExpression }}</p>
                      <p class="mt-1 text-xs text-slate-500">{{ rule.sourceText }}</p>
                    </div>
                    <span class="rounded-full bg-primary-700/10 px-3 py-1 text-xs font-semibold text-primary-700">
                      {{ rule.field }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold text-primary-700">Submission Input</h2>
              <p class="mt-1 text-sm text-slate-600">
                Paste a broker submission and extract facts for evaluation.
              </p>
            </div>
            <Badge variant="info">Step 2</Badge>
          </div>

          <textarea
            v-model="submission"
            class="mt-4 h-40 w-full resize-none rounded-xl border border-primary-700/20 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
          />

          <div class="mt-4 flex flex-wrap items-center gap-3">
            <Button
              variant="accent"
              :disabled="isAnalyzing || !rules.length"
              @click="onAnalyzeSubmission"
            >
              {{ isAnalyzing ? 'Analyzing...' : 'Analyze Submission' }}
            </Button>
            <Button variant="secondary" @click="resetSubmission">Reset</Button>
            <Button variant="ghost" @click="loadExampleSubmission">Load Example</Button>
          </div>
          <p v-if="analyzeError" class="mt-3 text-sm text-danger-700">
            {{ analyzeError }}
          </p>

          <div class="mt-6">
            <h3 class="text-sm font-semibold text-primary-700">Extracted Facts</h3>
            <p class="mt-1 text-xs text-slate-500">
              Facts extracted from the submission that are used to evaluate each rule.
            </p>

            <div class="mt-4 space-y-3">
              <div v-if="!facts.length" class="rounded-xl border border-dashed border-primary-700/20 bg-surface-100 p-6 text-sm text-slate-600">
                Analyze a submission to see extracted facts.
              </div>

              <div v-else class="space-y-3">
                <div
                  v-for="fact in facts"
                  :key="fact.field"
                  class="rounded-xl border border-primary-700/15 bg-white p-4 shadow-sm"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <p class="text-sm font-semibold text-slate-900">{{ fact.field }}</p>
                      <p class="mt-1 text-xs text-slate-500">
                        {{ fact.sourceSnippet || 'Extracted from submission' }}
                      </p>
                    </div>
                    <Badge :variant="factConfidenceVariant(fact.confidence)">
                      {{ (fact.confidence * 100).toFixed(0) }}% confidence
                    </Badge>
                  </div>
                  <p class="mt-3 text-sm text-slate-700">
                    <span class="font-medium">Value:</span> {{ displayFactValue(fact.value) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div class="mt-10">
        <Card>
          <div class="flex flex-col gap-4">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 class="text-xl font-semibold text-primary-700">Evaluation Report</h2>
                <p class="mt-1 text-sm text-slate-600">
                  See how the submission compares to your underwriting guidelines.
                </p>
              </div>
              <div class="flex items-center gap-3">
                <span
                  class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                  :class="{
                    'bg-success-500/15 text-success-700': overallStatus === 'PASS',
                    'bg-danger-500/15 text-danger-700': overallStatus === 'REFER',
                  }"
                >
                  <span class="h-2.5 w-2.5 rounded-full" :class="{ 'bg-success-500': overallStatus === 'PASS', 'bg-danger-500': overallStatus === 'REFER' }" />
                  Submission Result: {{ overallStatus }}
                </span>

                <Button variant="ghost" :disabled="!canCopyJson" @click="copyReport">
                  Copy JSON
                </Button>
              </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 class="text-sm font-semibold text-primary-700">Failed Rules</h3>
                <div class="mt-3 space-y-3">
                  <div v-if="failedResults.length === 0" class="rounded-xl border border-dashed border-primary-700/20 bg-surface-100 p-6 text-sm text-slate-600">
                    All rules passed.
                  </div>
                  <div v-for="result in failedResults" :key="result.ruleId" class="rounded-xl border border-danger-200 bg-danger-50 p-4">
                    <p class="text-sm font-semibold text-danger-800">{{ result.normalizedExpression }}</p>
                    <p class="mt-1 text-xs text-danger-700">Actual: {{ displayFactValue(result.actualValue) }}</p>
                    <p class="mt-1 text-xs text-danger-700">Reason: {{ result.reason }}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-primary-700">Passed Rules</h3>
                <div class="mt-3 space-y-3">
                  <div v-if="passedResults.length === 0" class="rounded-xl border border-dashed border-primary-700/20 bg-surface-100 p-6 text-sm text-slate-600">
                    No rules have passed yet.
                  </div>
                  <div v-for="result in passedResults" :key="result.ruleId" class="rounded-xl border border-success-200 bg-success-50 p-4">
                    <p class="text-sm font-semibold text-success-800">{{ result.normalizedExpression }}</p>
                    <p class="mt-1 text-xs text-success-700">Actual: {{ displayFactValue(result.actualValue) }}</p>
                    <p class="mt-1 text-xs text-success-700">Reason: {{ result.reason }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Card from '~/components/ui/Card.vue'
import Button from '~/components/ui/Button.vue'
import Badge from '~/components/ui/Badge.vue'
import type { Rule, ExtractedFact, EvaluationResult } from '~/types/models'
import { evaluateRules } from '~/utils/ruleEngine'

const defaultGuidelines = `Roof age must be less than 20 years
Maximum insured property value: $1,000,000
No more than 2 claims in the past 5 years
Home must be owner-occupied`

const defaultSubmission = `Property address: 123 Main St
Roof installed: 2001
Insured value: $850,000
Claims in last 5 years: 1
Occupancy: Owner occupied`

const guidelines = ref(defaultGuidelines)
const submission = ref(defaultSubmission)

const rules = ref<Rule[]>([])
const facts = ref<ExtractedFact[]>([])
const evaluation = ref<EvaluationResult[]>([])

type RulesApiResponse = {
  rules: Rule[]
}

type FactsApiResponse = {
  facts: ExtractedFact[]
}

const isGeneratingRules = ref(false)
const isAnalyzing = ref(false)
const generateError = ref<string | null>(null)
const analyzeError = ref<string | null>(null)

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

const onGenerateRules = async () => {
  isGeneratingRules.value = true
  generateError.value = null
  facts.value = []
  evaluation.value = []
  try {
    const response = await $fetch<RulesApiResponse>('/api/rules', {
      method: 'POST',
      body: { guidelineText: guidelines.value },
    })
    rules.value = response.rules
  } catch (error) {
    rules.value = []
    generateError.value = getErrorMessage(error)
  } finally {
    isGeneratingRules.value = false
  }
}

const onAnalyzeSubmission = async () => {
  isAnalyzing.value = true
  analyzeError.value = null
  evaluation.value = []
  try {
    const response = await $fetch<FactsApiResponse>('/api/facts', {
      method: 'POST',
      body: { submissionText: submission.value, rules: rules.value },
    })

    facts.value = response.facts
    evaluation.value = evaluateRules(rules.value, facts.value)
  } catch (error) {
    facts.value = []
    analyzeError.value = getErrorMessage(error)
  } finally {
    isAnalyzing.value = false
  }
}

const resetGuidelines = () => {
  guidelines.value = defaultGuidelines
  rules.value = []
  facts.value = []
  evaluation.value = []
  generateError.value = null
  analyzeError.value = null
}

const resetSubmission = () => {
  submission.value = defaultSubmission
  facts.value = []
  evaluation.value = []
  analyzeError.value = null
}

const loadExampleGuidelines = () => {
  guidelines.value = defaultGuidelines
}

const loadExampleSubmission = () => {
  submission.value = defaultSubmission
}

const displayFactValue = (value: any) => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return value
}

const factConfidenceVariant = (confidence: number) => {
  if (confidence > 0.8) return 'success'
  if (confidence > 0.5) return 'info'
  return 'neutral'
}

const results = computed(() => evaluation.value)
const failedResults = computed(() => results.value.filter((r) => !r.passed))
const passedResults = computed(() => results.value.filter((r) => r.passed))

const overallStatus = computed(() => {
  if (!results.value.length) return '—'
  return failedResults.value.length > 0 ? 'REFER' : 'PASS'
})

const canCopyJson = computed(() => rules.value.length > 0 && facts.value.length > 0)

const copyReport = async () => {
  const payload = {
    guidelines: guidelines.value,
    rules: rules.value,
    submission: submission.value,
    facts: facts.value,
    evaluation: evaluation.value,
    overallStatus: overallStatus.value,
  }
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
}

onMounted(() => {
  onGenerateRules()
})
</script>


